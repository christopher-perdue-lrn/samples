/*
Numberpad Custom Question Type
==============================
Here we implement a custom Learnosity Question type that allows the user
to enter a non-negative integer response using a custom numberpad.

The numberpad is constructed in the DOM with the following elements:
'.numperpad' : the container for the complete numberpad interface
    '.digit-colum': one for each digit of the correct question response
        '.response-cell': the topmost cell, which renders the selected digit in a '.digit-column'
        '.digit-cell': selectable cells, one for each digit, 0 through 9
*/

/*global LearnosityAmd*/
LearnosityAmd.define(['jquery-v1.10.2'], function ($) {
    'use strict';

    // Compose the HTML and event handlers required for the numberpad.
    function buildHtmlAndInteractions(init, lrnUtils) {

        // Dynamically determine the number of '.digit-column's required, based
        // on the number of digits in `valid_response`
        const digitCount = init.question.valid_response.length;

        // Return '.digit-column' HTML, with data attributes that link each cell
        // to the index `digitIdx` of the '.digit-column' in the final question response.
        // In the first '.digit-column',  digitIdx=0, in the next, digitIdx=1, and so on.
        function digitColumnHtml(digitIdx) {
            return [
                '<div class="digit-column">',
                    `<div class="numberpad-cell response-cell" data-digit-idx=${digitIdx}/>`,
                        // Render '.digit-cell' elements for each digit 0 through 9
                        [...Array(10).keys()].reduce((colHtml, digit) => {
                            return colHtml +
                                `<div
                                    class="numberpad-cell digit-cell"
                                    data-digit-idx=${digitIdx}
                                >
                                    ${digit}
                                </div>`;
                        }, ''),
                '</div>'
            ].join('');
        }

        // Compose the final '.numberpad' HTML
        const $htmlObj = $([
            '<div id="numberpad">',
                [...Array(digitCount).keys()].reduce((colsHtml, digitIdx) => {
                    return colsHtml + digitColumnHtml(digitIdx);
                }, ''),
            '</div>'
        ].join(''));

        // '.digit-cell' click event handler
        $htmlObj.find('.digit-cell').click(function() {
            const digitIdx = $(this).attr('data-digit-idx');

            // Unstyle any previously selected '.digit-cell' elements in the
            // same '.digit-column' as the selected '.digit-cell'
            $(`#numberpad .digit-cell[data-digit-idx=${digitIdx}].selected`)
                .removeClass('selected');

            // Add 'selected' class to the clicked '.digit-cell'
            $(this).addClass('selected');

            // Display the selected digit in the 'response-cell' in the same
            // '.digit-column' as the selected '.digit-cell'
            $(`#numberpad .response-cell[data-digit-idx=${digitIdx}]`)
                .text($.trim($(this).text()));
        })

        return $htmlObj;
    }

    //function to change UI based on correct or incorrect answer status
    function addValidationUI(questionAnswerStatus) {
        // Update 'response-cell's with 'valid' class if questionAnswerStatus===true,
        // or with 'invalid' class if questionAnswerStatus===false.
        $('#numberpad .response-cell')
            .removeClass('invalid valid') // Clear any existing `valid`/`invalid` classes
            .addClass( questionAnswerStatus ? 'valid' : 'invalid');
    }

    function CustomNumberPad(init, lrnUtils) {

        //create example table and button elements for constructing numberpad.
        var $questionTypeHtml = buildHtmlAndInteractions(init);
        this.$el = init.$el;

        // add Check Answer button
        init.$el.html($questionTypeHtml);
        init.$el.append('<div data-lrn-component="checkAnswer"/>');
        lrnUtils.renderComponent('CheckAnswerButton', this.$el.find('[data-lrn-component="checkAnswer"]').get(0));

        //Reset '.response-cell' valid/invalid classes on '.digit-cell' click
//         this.$el.find('#numberpad .digit-cell')
//             .on('click', function () {
//                 $('#numberpad .response-cell').removeClass('invalid valid');
//                 init.events.trigger('changed', $('#numberpad .response-cell').text());
//             });

//         //add on validate
//         init.events.on('validate', function () {
//             init.response = $('#numberpad .response-cell').text();
//             // Create scorer
//             var scorer = new CustomNumberPadScorer(init.question, init.response);
//             //check if answer is correct, and pass true or false to the function to update validation UI
//             addValidationUI(scorer.isValid());
//         });
        
        //tell "host API" that this question is ready
        init.events.trigger('ready');
    }

    //set question and response
    function CustomNumberPadScorer(question, response) {
        this.question = question;
        this.response = response;
    }

    //check if answer is valid
    CustomNumberPadScorer.prototype.isValid = function () {
        return $('#numberpad .response-cell').text() === this.question.valid_response;
    };
    
    //score
    CustomNumberPadScorer.prototype.score = function () {
        return this.isValid() ? this.maxScore() : 0;
    };

    //max score
    CustomNumberPadScorer.prototype.maxScore = function () {
        return this.question.score || 1;
    };

    //check if a valid response was set so validation can proceed
    CustomNumberPadScorer.prototype.canValidateResponse = function () {
        // `valid_response` must be a non-negative integer, so we test that
        // its value contains only digits (and at least one digit).
        return /^\d+$/.test( this.question.valid_response );
    };

    //return custom question and scoring hook to "host API"
    return {
        Question: CustomNumberPad,
        Scorer: CustomNumberPadScorer
    };
});
