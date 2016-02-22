    // Mihai

    {
        init: function(elevators, floors) {
            var elevator;

            function _attach(objects, funcs) {
                for (var obj of objects) {
                    for (var func of funcs) {
                        obj[func.name] = func;
                    }
                }
            }

            function getFreeElevator (floorNum) {
                var maxLoad = 1,
                    result = elevators[0];

                for (var elevator of elevators) {
                    if (elevator.loadFactor() < maxLoad && elevator.canPickUpPassengersAt(floorNum)) {
                        maxLoad = elevator.loadFactor();
                        result = elevator;
                    }
                }

                return result;
            }

            function goingTo (floorNum) {
                return this.destinationQueue.indexOf(floorNum) != -1;
            }
            function canStopAt (floorNum) {
                var fl = floors[floorNum];

                return (this.goingDownIndicator() && this.currentFloor() > floorNum && fl.buttonStates.down) ||
                       (this.goingUpIndicator() && this.currentFloor() < floorNum && fl.buttonStates.up);
            }
            function canPickUpPassengersAt (floorNum) {
                var fl = floors[floorNum];

                if (this.loadFactor() == 1) {
                    return false;
                }
                if (!fl.buttonStates.up && !fl.buttonStates.down) {
                    return false;
                }

                return  (this.goingDownIndicator() || !fl.buttonStates.down) && (this.goingUpIndicator() || !fl.buttonStates.up);
            }
            _attach(elevators, [goingTo, canStopAt, canPickUpPassengersAt]);


            for (elevator of elevators) {  
                elevator.on("idle", function() {
                });
                elevator.on("floor_button_pressed", function (floorNum) {
                    if (!this.goingTo(floorNum)) {
                        this.goToFloor(floorNum);
                    }
                });
                elevator.on("passing_floor", function (floorNum) {
                    var i = this.destinationQueue.indexOf(floorNum),
                        fl = floors[floorNum];

                    if (i != -1) {
                        this.destinationQueue.splice(i, 1);
                        this.destinationQueue.unshift(floorNum);

                        if (this.getPressedFloors().indexOf(floorNum) == -1 && this.loadFactor() == 1) {
                            this.destinationQueue.shift();
                        }

                        this.checkDestinationQueue();
                    } else if (this.canPickUpPassengersAt(floorNum)) {
                        this.destinationQueue.unshift(floorNum);

                        this.checkDestinationQueue();
                    } else {
                        this.goingUpIndicator(this.destinationQueue[0] > floorNum);
                        this.goingDownIndicator(this.destinationQueue[0] < floorNum);                    
                    }
                });
                elevator.on("stopped_at_floor", function (floorNum) {
                    var other, i, j,
                        fl = floors[floorNum];

                    this.goingUpIndicator(true);
                    this.goingDownIndicator(true);

                    if (this.canPickUpPassengersAt(floorNum)) {
                        for (other of elevators) {
                            if (this !== other) {
                                i = other.destinationQueue.indexOf(floorNum);
                                j = other.getPressedFloors().indexOf(floorNum);
                                if (i != -1 && j == -1) {
                                    other.destinationQueue.splice(i, 1);
                                    other.checkDestinationQueue();
                                }
                            }
                        }

                        this.goingUpIndicator(!!fl.buttonStates.up);
                        this.goingDownIndicator(!!fl.buttonStates.down);
                    } else if (this.loadFactor() == 1) {
                        this.destinationQueue = this.getPressedFloors();
                        this.checkDestinationQueue();
                    }
                })
            };

            for (var i = floors.length - 1; i >= 0; i--) {
                floors[i].on("up_button_pressed", function () {
                    var floorNum = this.floorNum();

                    for (var elevator of elevators) {
                        if (elevator.goingTo(floorNum) && elevator.canStopAt(floorNum)) {
                            return;
                        }
                    }

                    getFreeElevator(floorNum).goToFloor(floorNum);
                });
                floors[i].on("down_button_pressed", function () {
                    var floorNum = this.floorNum();

                    for (var elevator of elevators) {
                        if (elevator.goingTo(floorNum)) {
                            return;
                        }
                    }

                    getFreeElevator(floorNum).goToFloor(floorNum);
                });
            };
        },
        update: function(dt, elevators, floors) {
            // We normally don't need to do anything here
        }
    }