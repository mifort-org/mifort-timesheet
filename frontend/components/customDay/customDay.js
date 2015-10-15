/*!
 * Copyright 2015 mifort.org
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *  http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

angular.module('myApp')
    .directive('customDay', function($location) {
        return {
            scope: true,
            link: function(scope, element) {
                var customDaysLength = $('.custom-day').length;
                $('.custom-day').each(function(i) {
                    $(this).css('z-index', customDaysLength - i);
                });
                var svg,
                    color = ["#c5e9fb", "#f3cce1", "#fff9a1", '#d9d9d9', "#c5e9fb", "#f3cce1", "#fff9a1", '#d9d9d9'],
                    lastColor = 'transparent',
                    margin = {
                        top: 50,
                        right: 0,
                        bottom: 0,
                        left: 50
                    },
                    MapColumns = 1;


                function init(){
                    $("#chart").html('');
                    var MapRows = $('.custom-days-wrapper dt').length,
                        height = MapRows * 71,
                        hexRadius = height / ((MapRows + 1 / 3) * 1.5),
                        width = MapColumns * hexRadius * Math.sqrt(3),
                        hexbin = d3.hexbin().radius(hexRadius), //Hexagon radius
                        points = [];

                    //Calculate the center positions of each hexagon
                    for (var i = 0; i < MapRows; i++) {
                        for (var j = 0; j < MapColumns; j++) {
                            points.push([hexRadius * j * 1.75, hexRadius * i * 1.5]);
                        }
                    }

                    //Create SVG element
                    height = MapRows * 1.5 * hexRadius + 0.5 * hexRadius;

                    svg = d3.select("#chart").append("svg")
                        .attr("height", height + margin.top)
                        .attr("width", 140)
                        .append("g")
                        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

                    //Draw the hexagons
                    svg.append("g")
                        .selectAll(".hexagon-stroke")
                        .data(hexbin(points))
                        .enter().append("path")
                        .attr("class", "hexagon-stroke")
                        .attr("d", function(d) {
                            return "M" + d.x + "," + d.y + hexbin.hexagon();
                        })
                        .attr("stroke", function(d, i) {
                            return "#e9e9e9";
                        })
                        .attr("stroke-width", "4px")
                        .style("fill", "transparent");

                    svg.append("g")
                        .selectAll(".hexagon")
                        .data(hexbin(points))
                        .enter().append("path")
                        .attr("class", "hexagon")
                        .attr("d", function(d) {
                            return "M" + d.x + "," + d.y + hexbin.hexagon();
                        })
                        //.attr("transform", function(d) {
                        //    console.log(d);
                        //    if(d.j && d.j % 2){
                        //        d.x -= 35;
                        //        return "translate(" + d.x + ",0)";
                        //    }
                        //})
                        .attr("stroke", function(d, i) {
                            return "#fff";
                        })
                        .attr("stroke-width", "2px")
                        .style("fill", function(d, i) {
                            if(d.j == $(".hexagon").length - 1){
                                return lastColor;
                            }
                            else{
                                return color[i];
                            }
                        })
                        .on("mouseover", mouseOver)
                        .on("mouseout", mouseOut);

                    $(".hexagon:last-child").click(function(e) {
                        //test
                        $('.custom-days-wrapper dl').append('<dt>Weekend</dt><dd>6 hours</dd>');
                        init();
                    });
                }
                init();

                function mouseOver() {
                    $(".hexagon-stroke:eq(" + $(this).index() + ")").attr("stroke", function(d, i) {
                        return "#aeaeae";
                    });
                }

                function mouseOut() {
                    $(".hexagon-stroke:eq(" + $(this).index() + ")").attr("stroke", function(d, i) {
                        return "#e9e9e9";
                    })
                }


            },
            templateUrl: 'components/customDay/customDay.html'
        };
    });