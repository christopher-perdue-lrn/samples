/*
Geo Select Custom Question Type
==============================
Here we implement a custom Learnosity Question type that allows the user
to select a country on an interactive glabal map.

- The globe is rendered with d3.js. You can rotate the globe with a click and drag.
    Country names are displayed in tooltips on hover.
- A country is selected on click, and becomes the Learnosity question response.
*/

/*global LearnosityAmd*/
LearnosityAmd.define(['jquery-v1.10.2'], function ($) {
    'use strict';

    // The Learnosity question response, a country name string
    let response = null;

    // Build the interactive global map in the DOM with d3.
    // Forked from http://bl.ocks.org/KoGor/5994804
    function buildHtmlAndInteractions(init, lrnUtils) {

        const width = 600,
            height = 500,
            sens = 0.25;

        //Set the projection
        const projection = d3.geo.orthographic()
            .scale(245)
            .rotate([0, 0])
            .translate([width / 2, height / 2])
            .clipAngle(90);
        const path = d3.geo.path().projection(projection);

        // Build the globe DOM elements
        const svg = d3.select('.question-container').append('svg')
            .attr('id', 'globe')
            .attr('width', width)
            .attr('height', height);

        // Render water paths on the globe
        svg.append('path')
            .datum({ type: 'Sphere' })
            .attr('class', 'water')
            .attr('d', path);

        // Add a tooltip to display country names on hover
        const countryTooltip = d3.select('body').append('div').attr('class', 'countryTooltip');

        // Load the required geo and country name data
        queue()
            .defer(d3.json, 'helpers/geo/world-110m.json')
            .defer(d3.tsv, 'helpers/geo/world-110m-country-names.tsv')
            .await(ready);

        function ready(error, world, countryData) {

            const countries = topojson.feature(world, world.objects.countries).features;

            // Build hash for looking up country names by id
            const countryById = {};
            countryData.forEach(function(d) {
                countryById[ d.id ] = d.name;
            });

            // Render land paths on the globe
            world = svg.selectAll('path.land')
                .data(countries)
                .enter().append('path')
                .attr('class', 'land')
                .attr('d', path)
                .attr('id', d => d.id);

            // Rerender globe on drag event
            svg.selectAll('path').call(d3.behavior.drag()
                .origin(function() {
                    const r = projection.rotate();
                    return { x: r[0] / sens, y: -r[1] / sens };
                })
                .on('drag', function() {
                    const rotate = projection.rotate();
                    projection.rotate([d3.event.x * sens, -d3.event.y * sens, rotate[2]]);
                    svg.selectAll('path.land').attr('d', path);
                }));

            // Country event handlers
            svg.selectAll('path.land')
                // Display country name in tooltip on hover
                .on('mouseover', function(d) {
                    countryTooltip.text( countryById[d.id] )
                    .style('left', (d3.event.pageX + 7) + 'px')
                    .style('top', (d3.event.pageY - 15) + 'px')
                    .style('display', 'block')
                    .style('opacity', 1);
                })
                // Hide country name tooltip on mouseout
                .on('mouseout', function(d) {
                    countryTooltip.style('opacity', 0)
                        .style('display', 'none');
                })
                // Move country name tooltip with cursor
                .on('mousemove', function(d) {
                    countryTooltip.style('left', (d3.event.pageX + 7) + 'px')
                        .style('top', (d3.event.pageY - 15) + 'px');
                })

                //Country click event handler
                .on('click', function() {
                    // If this is actually a drag event, do nothing.
                    if (d3.event.defaultPrevented) return;

                    // Set question response to selected country
                    response = countryById[ this.getAttribute('id') ];

                    // Clear previously applied response validation styling
                    d3.select('.focused').classed('invalid', false)
                        .classed('valid', false);

                    const focusedCountry = countries.find(country => {
                        return country.id === parseInt( this.getAttribute('id') );
                    });
                    const focusedCentroid = d3.geo.centroid( focusedCountry );

                    //Globe rotating
                    (function transition() {
                        d3.transition()
                        .duration(1000)
                        .tween('rotate', function() {
                            const r = d3.interpolate(
                                projection.rotate(),
                                [-focusedCentroid[0], -focusedCentroid[1]]
                            );
                            return function(t) {
                                projection.rotate( r(t) );
                                svg.selectAll('path').attr('d', path)
                                    .classed('focused', d => d.id === focusedCountry.id);
                            };
                        });
                    })();
                });
        };

        return $('#globe');
    }

    //function to change UI based on correct or incorrect answer status
    function addValidationUI(questionAnswerStatus) {
        // Update focused country element with 'valid' class if questionAnswerStatus===true,
        // or with 'invalid' class if questionAnswerStatus===false.
        d3.select('.focused').classed('invalid', false)
            .classed('valid', false)
            .classed(questionAnswerStatus ? 'valid' : 'invalid', true);
    }

    function CustomGeoSelect(init, lrnUtils) {

        var $questionTypeHtml = buildHtmlAndInteractions(init);
        this.$el = init.$el;

        // add Check Answer button
        init.$el.html($questionTypeHtml);
        init.$el.append('<div data-lrn-component="checkAnswer"/>');
        lrnUtils.renderComponent('CheckAnswerButton', this.$el.find('[data-lrn-component="checkAnswer"]').get(0));

        //Reset input field valid/invalid classes on focus
        this.$el.find('#globe')
            .on('focus', function () {
                $('.focused').removeClass('invalid valid');
            })
            .on('click', function () {
                init.events.trigger('changed', response);
            });

        //add on validate
        // init.events.on('validate', function () {
        //     init.response = response;
        //     // Create scorer
        //     var scorer = new CustomGeoSelectScorer(init.question, init.response);
        //     //check if answer is correct, and pass true or false to the function to update validation UI
        //     addValidationUI(scorer.isValid());
        // });
        

        const facade = init.getFacade();
        const facadeValidate = facade.validate;
        let showSolution = false;
        facade.showSolution = function (options) {
            alert('eyo')
        };

        init.events.on("validate", function (options) {
            // do the usual validate stuff here
            // then do specific solution stuff
            if (showSolution) {
                
            }
        });


        //tell "host API" that this question is ready
        init.events.trigger('ready');
    }

    //set question and response
    function CustomGeoSelectScorer(question, response) {
        this.question = question;
        this.response = response;
    }

    //check if answer is valid
    CustomGeoSelectScorer.prototype.isValid = function () {
        return response === this.question.valid_response;
    };
    
    //score
    CustomGeoSelectScorer.prototype.score = function () {
        return this.isValid() ? this.maxScore() : 0;
    };

    //max score
    CustomGeoSelectScorer.prototype.maxScore = function () {
        return this.question.score || 1;
    };

    //check if a valid response was set so validation can proceed
    CustomGeoSelectScorer.prototype.canValidateResponse = function () {
        return !!this.question.valid_response;
    };

    //return custom question and scoring hook to "host API"
    return {
        Question: CustomGeoSelect,
        Scorer: CustomGeoSelectScorer
    };
});
