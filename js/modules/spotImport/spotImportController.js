(function () {
    'use strict';

    angular
      .module('recycler')
      .controller('sportImportController', ['$scope', '$rootScope', 'sportImportFactory', 'usSpinnerService',
        function ($scope, $rootScope, sportImportFactory, usSpinnerService) {
            $scope.newSpots = [];
            $scope.updatedSpots = [];
            $scope.markerData = [];
            $scope.spotData = [];
            $scope.customIndex = 0;
            $scope.count = 0;

            sportImportFactory.getSpotsFromMaptive()
              .then(function (result) {
                  usSpinnerService.spin('spinner-1');
                  $scope.maptiveSpots = result;

                  sportImportFactory.getSpotsFromDb()
                    .then(function (result) {
                        $scope.telerikSpots = result;

                        _.forEach($scope.telerikSpots.result, function (item, index) {
                            item.Latitude = parseFloat(item.Latitude, 10);
                            item.Longitude = parseFloat(item.Longitude, 10);
                        });

                        var sortedTelerikSpots = _.sortBy($scope.telerikSpots.result, 'Latitude');
                        var sortedMaptiveSpots = _.sortBy($scope.maptiveSpots.markers, 'lt');

                        _.forEach(sortedTelerikSpots, function (telerikSpot) {
                            _.forEach(sortedMaptiveSpots, function (maptiveSpot, index) {
                                if (telerikSpot.Latitude == maptiveSpot.lt) {
                                    if (telerikSpot.Longitude == maptiveSpot.lg) {
                                        sortedMaptiveSpots.splice(index, 1);
                                        $scope.updatedSpots.push(maptiveSpot);
                                    }
                                } else {
                                    $scope.newSpots.push(maptiveSpot);
                                    $scope.newSpots = _.uniq($scope.newSpots);
                                }
                            })
                        })
                    });
              });

            $scope.$watch('newSpots.length', function (newData) {
                if (newData) {
                    usSpinnerService.stop('spinner-1');
                }
            });

            $scope.deleteTerracycle = function () {
                var spotData = $rootScope.el.data('Spot');
                //var filter = new Everlive.Query();
                //filter.where().eq('SpotType', 'Terracycle');

                //spotData.get(filter)
                //    .then(function (data) {
                //        debugger;
                //    },
                //        function (error) {
                //            alert(JSON.stringify(error));
                //        });

                spotData.destroy({ 'SpotType': 'Terracycle' }, // filter
                    function (data) {
                        alert('Items successfully deleted.');
                    },
                    function (error) {
                        alert(JSON.stringify(error));
                    });
            };

            $scope.splitDataFromUrl = function () {
                $scope.isImporting = true;
                // http://www.maptive.com/ver3/data.php?operation=get_map_markers&map_id=84877&bounds=53.003421,6.994009,58.592772,13.959341
                for (var i = 0; i < $scope.newSpots.length; i++) {
                    var spot = $scope.newSpots[i];
                    spot.Description = '';
                    //debugger;
                    var description = spot.d;
                    var divs = description.split('</div>');
                    divs = _.omit(divs, _.isEmpty);

                    //if(index - $scope.count == _.size(divs) - 1) {
                    //  $scope.customIndex += _.size(divs) - 1;
                    //  $scope.count += index;
                    //}

                    _.forEach(divs, function (div, index2) {
                        index2 = parseInt(index2);

                        if (div.length > 0) {

                            //$scope.spotData[$scope.customIndex + index2] = {
                            //    weeksDayStart: 0,
                            //    weeksDayEnd: 0,
                            //    saturdayStart: 0,
                            //    saturdayEnd: 0,
                            //    sundayStart: 0,
                            //    sundayEnd: 0,
                            //    Description: ''
                            //};

                            var day = div.match(new RegExp('\<b\>' + '(.*)' + '\<\/b\>'));
                            var translatedDay = translateDay(day[1]);

                            if (translatedDay == undefined) {
                                //$scope.markerData[index].translatedData.push({
                                //    'day': translatedDay,
                                //    'description': 'TODO: Collection Square donates to: Students donate to projects abroad. At the moment, the footballs to Cambodia'
                                //});
                                //$scope.spotData[$scope.customIndex + index2].Description = $scope.markerData[index].translatedData.description;

                                spot.Description += $(div + "</div>").text();
                            } else {
                                var time = div.split(';');
                                var translatedTime = translateDate(time[1], $scope.customIndex + index2, translatedDay);

                                //$scope.markerData[index].translatedData.push({
                                //    'day': translatedDay,
                                //    'description': translatedTime
                                //});
                                if (translatedDay == "Monday") {
                                    if (translatedTime !== undefined && translatedTime !== null) {
                                        spot.OpeningHoursWeekdaysFrom = translatedTime.start;
                                        spot.OpeningHoursWeekdaysTo = translatedTime.end;
                                    } else {
                                        spot.OpeningHoursWeekdaysFrom = spot.OpeningHoursWeekdaysTo = 0;
                                    }
                                }
                                else if (translatedDay == "Saturday") {
                                    if (translatedTime !== undefined && translatedTime !== null) {

                                        spot.OpeningHoursSaturdayFrom = translatedTime.start;
                                        spot.OpeningHoursSaturdayTo = translatedTime.end;
                                    } else {
                                        spot.OpeningHoursSaturdayFrom = spot.OpeningHoursSaturdayTo = 0;
                                    }
                                }
                                else if (translatedDay == "Sunday") {
                                    if (translatedTime !== undefined && translatedTime !== null) {
                                        spot.OpeningHoursSundayFrom = translatedTime.start;
                                        spot.OpeningHoursSundayTo = translatedTime.end;
                                    } else {
                                        spot.OpeningHoursSundayFrom = spot.OpeningHoursSundayTo = 0;
                                    }
                                }
                            }

                        }
                    });
                    var spotData = $rootScope.el.data('Spot');
                    var location = {
                        longitude: spot.ln,
                        latitude: spot.lt
                    };
                    spotData.create({
                        //'userId': spot.UserID,
                        "Name": spot.t,
                        "Description": spot.Description,
                        "Longitude": spot.ln,
                        "Latitude": spot.lt,
                        "Country": 'DK',
                        //"City": spot.City,
                        //"CVR": spot.CVR,
                        "Address": spot.a,
                        "EventDate": spot.EventDate,
                        "Phone": spot.Phone,
                        "SpotType": 'Terracycle',
                        //"State": spot.State,
                        //"Web": spot.Web,
                        "Zip": spot.postalcode,
                        "ClosingTimeSat": '-',
                        "ClosingTimeSun": '-',
                        "ClosingTimeWeekdays": '-',
                        "OpeningHoursSaturdayFrom": spot.OpeningHoursSaturdayFrom,
                        "OpeningHoursSaturdayTo": spot.OpeningHoursSaturdayTo,
                        "OpeningHoursSundayFrom": spot.OpeningHoursSundayFrom,
                        "OpeningHoursSundayTo": spot.OpeningHoursSundayTo,
                        "OpeningHoursWeekdaysFrom": spot.OpeningHoursWeekdaysFrom,
                        "OpeningHoursWeekdaysTo": spot.OpeningHoursWeekdaysTo,
                        "OpeningTimeSat": '-',
                        "OpeningTimeSun": '-',
                        "OpeningTimeWeekdays": '-',
                        //"Image": res.result.Uri,
                        "Location": location

                    },
                      function (data) {
                          //debugger;

                      },
                      function (error) {
                          console.log(error);
                      });
                    //sportImportFactory.getMarkers()
                    //  .then(function (result) {
                    //    _.forEach(result.markers, function (marker, index) {

                    //      $scope.markerData.push(marker);
                    //      $scope.markerData[index].translatedData = [];

                    //      var description = marker.d;
                    //      var divs = description.split('</div>');
                    //      divs = _.omit(divs, _.isEmpty);

                    //      if(index - $scope.count == _.size(divs) - 1) {
                    //        $scope.customIndex += _.size(divs) - 1;
                    //        $scope.count += index;
                    //      }

                    //      _.forEach(divs, function (div, index2) {
                    //        index2 = parseInt(index2);

                    //        if (div.length > 0) {

                    //          $scope.spotData[$scope.customIndex + index2] = {
                    //            weeksDayStart: 0,
                    //            weeksDayEnd: 0,
                    //            saturdayStart: 0,
                    //            saturdayEnd: 0,
                    //            sundayStart: 0,
                    //            sundayEnd: 0,
                    //            Description: ''
                    //          };

                    //          var day = div.match(new RegExp('\<b\>' + '(.*)' + '\<\/b\>'));
                    //          var translatedDay = translateDay(day[1]);

                    //          if (translatedDay == undefined) {
                    //            $scope.markerData[index].translatedData.push({
                    //              'day': translatedDay,
                    //              'description': 'TODO: Collection Square donates to: Students donate to projects abroad. At the moment, the footballs to Cambodia'
                    //            });
                    //            $scope.spotData[$scope.customIndex + index2].Description = $scope.markerData[index].translatedData.description;
                    //          } else {
                    //            var time = div.split(';');
                    //            var translatedTime = translateDate(time[1], $scope.customIndex + index2, translatedDay);

                    //            $scope.markerData[index].translatedData.push({
                    //              'day': translatedDay,
                    //              'description': translatedTime
                    //            });
                    //          }

                    //        }
                    //      });
                    //    })
                    //  });
                }

            };

            function translateDay(day) {
                day = day.trim();
                switch (day) {
                    case 'Mandag':
                        {
                            return 'Monday'
                        }
                    case 'Tirsdag':
                        {
                            return 'Tuesday'
                        }
                    case 'Onsdag':
                        {
                            return 'Wednesday'
                        }
                    case 'Torsdag':
                        {
                            return 'Thursday'
                        }
                    case 'Fredag':
                        {
                            return 'Friday'
                        }
                    case 'Lørdag':
                        {
                            return 'Saturday'
                        }
                    case 'Søndag':
                        {
                            return 'Sunday'
                        }
                }
            }

            function translateDate(date, index, translatedDay) {
                // input: 08.00-16.00
                // output: 8:00 to 4:00 p.m.
                var times = date.split('-');

                if (!_.isEmpty(times) && Array.isArray(times) && times.length >= 2) {
                    //var openingHour = parseInt(times[0].substring(0, 2));
                    //$scope.spotData[index].weeksDayStart = openingHour;
                    //var openingMinute = times[0].substr(3, 2);
                    //var openingIsPM = false;
                    //if (openingHour > 12) {
                    //  openingIsPM = true;
                    //}
                    //var openingResult = openingIsPM ?
                    //(parseInt(openingHour) - 12) + ':' + openingMinute + 'p.m' :
                    //parseInt(openingHour) + ':' + openingMinute;

                    //var closingHour = parseInt(times[1].substring(0, 2));
                    //$scope.spotData[index].weeksDayEnd = closingHour;
                    //var closingMinute = times[1].substr(3, 2);
                    //var closingIsPM = false;
                    //if (closingHour > 12) {
                    //  closingIsPM = true;
                    //}
                    //var closingResult = closingIsPM ?
                    //(parseInt(closingHour) - 12) + ':' + closingMinute + ' p.m.' :
                    //parseInt(closingHour) + ':' + closingMinute;

                    //return openingResult + ' to ' + closingResult;
                    var start = parseInt(times[0].substring(0, 2));
                    var end = parseInt(times[1].substring(0, 2));
                    return { start: start, end: end }
                } else if (date.toLowerCase() === 'lukket') {
                    //if (translatedDay === 'Saturday') {
                    //  $scope.spotData[index].saturdayStart = 0;
                    //  $scope.spotData[index].saturdayEnd = 0;
                    //}
                    //if (translatedDay === 'Sunday') {
                    //  $scope.spotData[index].sundayStart = 0;
                    //  $scope.spotData[index].sundayEnd = 0;
                    //}
                    //return 'Closed';
                    return { start: 0, end: 0 }
                } else if (date.toLowerCase() === 'døgnåbent') {
                    return { start: 1, end: 24 }
                }
            }

            //$scope.import = function (spot) {
            //  $scope.spotData.push({
            //    //'userId': spot.UserID,
            //    "Name": spot.t,
            //    "Description": spot.d,
            //    "Longitude": spot.ln,
            //    "Latitude": spot.lt,
            //    "Country": 'Denmark',
            //    //"City": spot.City,
            //    //"CVR": spot.CVR,
            //    "Address": spot.l,
            //    //"EventDate": spot.EventDate,
            //    //"Phone": spot.Phone,
            //    //"SpotType": spot.SpotType,
            //    //"State": spot.State,
            //    //"Web": spot.Web,
            //    "Zip": spot.postalcode,
            //
            //    //"ClosingTimeSat": spot.ClosingTimeSat,
            //    //"ClosingTimeSun": spot.ClosingTimeSun,
            //    //"ClosingTimeWeekdays": spot.ClosingTimeWeekdays,
            //
            //    //"OpeningHoursSaturdayFrom": spot.OpeningHoursSaturdayFrom,
            //    //"OpeningHoursSaturdayTo": spot.OpeningHoursSaturdayTo,
            //    //"OpeningHoursSundayFrom": spot.OpeningHoursSundayFrom,
            //    //"OpeningHoursSundayTo": spot.OpeningHoursSundayTo,
            //    //"OpeningHoursWeekdaysFrom": spot.OpeningHoursWeekdaysFrom,
            //    //"OpeningHoursWeekdaysTo": spot.OpeningHoursWeekdaysTo,
            //
            //    //"OpeningTimeSat": spot.OpeningTimeSat,
            //    //"OpeningTimeSun": spot.OpeningTimeSun,
            //    //"OpeningTimeWeekdays": spot.OpeningTimeWeekdays,
            //    //"Image": res.result.Uri,
            //    //"Location": location
            //  });
            //}
        }])
})();