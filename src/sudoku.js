"use strict";

// Google jam challenge "(A) Sudoku Checker"
// https://code.google.com/codejam/contest/2929486/dashboard#s=p0
// Author: Aspallar
//
// Problem (Note: N2 = N squared.)
// Given a completed N2xN2 Sudoku matrix, your task is to determine whether it is a valid solution.
// A valid solution must satisfy the following criteria: 
// •Each row contains each number from 1 to N2, once each.
// •Each column contains each number from 1 to N2, once each.
// •Divide the N2xN2 matrix into N2 non-overlapping NxN sub-matrices. Each sub-matrix contains each
//  number from 1 to N2, once each. 
//
// You don't need to worry about the uniqueness of the problem. Just check if the given matrix is
// a valid solution. 
//
// Input
// The first line of the input gives the number of test cases, T. T test cases follow. Each test case
// starts with an integer N. The next N2 lines describe a completed Sudoku solution, with each line
// contains exactly N2 integers. All input integers are positive and less than 1000. 
//
// Output
// For each test case, output one line containing "Case #x: y", where x is the case number (starting
// from 1) and y is "Yes" (quotes for clarity only) if it is a valid solution, or "No" (quotes for
// clarity only) if it is invalid. Note that the judge is case-sensitive, so answers of "yes" and "no"
// will not be accepted. 
//
// Limits
// 1 ≤ T ≤ 100. 
//
// Small dataset
// N = 3. 
//
// Large dataset
// 3 ≤ N ≤ 6. 
///////////////////////////////////////////////////////////////////////////////////////////


var split = require("split");
var util = require("util");
var fs = require("fs");
var Transform = require("stream").Transform;

function main() {
    let inputStream = (process.argv.length === 3) ? fs.createReadStream(process.argv[2]) : process.stdin;
    inputStream.setEncoding("ascii")
        .pipe(split())
        .pipe(new PuzzleParserStream())
        .pipe(new PuzzleValidatorStream())
        .pipe(new FormatResultsStream())
        .pipe(process.stdout);
}

///////////////////////////////////////////////////////////////////////////////////////////
// PuzzleParserStream

function PuzzleParserStream () {
    Transform.call(this, { objectMode: true });

    this.puzzle = null;
    this.lines = 0;
    this.firstLine = true;
}
util.inherits(PuzzleParserStream, Transform);

PuzzleParserStream.prototype._transform = function (line, encoding, cbDone) {
    if (this.firstLine) {
        // line contains total number of puzzles: ignore it, we don't need the total number of puzzles
        this.firstLine = false;
    }
    else if (this.lines === 0) {
        // line contains size of puzzle: start a new puzzle
        let size = +line;
        this.lines = size * size;
        this.puzzle = [];
    }
    else {
        // line contains a row of puzzle: add the line to the puzzle
        let numbers = line.split(" ");
        for (let k=0, l=numbers.length; k < l; k++) {
            numbers[k] = +numbers[k];
        }
        this.puzzle.push(numbers); 

        if (--this.lines === 0) {
            // last line of puzzle reached: add puzzle to the output stream
            this.push(this.puzzle);
        }
    }
    cbDone();
};

///////////////////////////////////////////////////////////////////////////////////////////
// PuzzleValidatorStream

function PuzzleValidatorStream () {
    Transform.call(this, { objectMode: true });
}
util.inherits(PuzzleValidatorStream, Transform);


PuzzleValidatorStream.prototype._transform = function (puzzle, encoding, cbDone) {
    let validPuzzle = checkRowsAndColumns(puzzle) && checkGrids(puzzle);
    this.push(validPuzzle);
    cbDone();
};

////////////////////////////////////////////////////////////////////////////////////////////
// FormatResultsStream

function FormatResultsStream () {
    Transform.call(this, { objectMode: true });
    this.caseNumber = 0;
}
util.inherits(FormatResultsStream, Transform);

FormatResultsStream.prototype._transform = function (validpuzzle, encoding, cbDone) {
    let result = validpuzzle ? "Yes" : "No";
    this.push(`Case #${++this.caseNumber}: ${result}\n`);
    cbDone();
};

////////////////////////////////////////////////////////////////////////////////////////////
// NumberOccurance

function NumberOccurance(length)
{
    this.present = new Array(length).fill(false);
}

NumberOccurance.prototype.isNumberMissing = function () {
    return (this.present.indexOf(false) > -1)
}

NumberOccurance.prototype.set = function (n) {
    this.present[n-1] = true;
}

NumberOccurance.prototype.reset = function () {
    this.present.fill(false);
}

////////////////////////////////////////////////////////////////////////////////////////////
function checkRowsAndColumns(problem) {
    let length = problem.length;
    let i, j, rowVal, colVal;
    let rowPresent = new NumberOccurance(length);
    let colPresent = new NumberOccurance(length);

    for (i=0; i<length; i++) {
        for (j=0; j<length; j++) {
            rowVal = problem[i][j];
            colVal = problem[j][i];
            if (rowVal < 1 || rowVal > length || colVal < 1 || colVal > length ) {
                return false; // value out of range
            }
            rowPresent.set(rowVal);
            colPresent.set(colVal);
        }

        if ( rowPresent.isNumberMissing() || colPresent.isNumberMissing() )
            return false; // not all numbers present in row or column
            
        rowPresent.reset();
        colPresent.reset();
    }

    return true;
}

function gridPassed(problem, colOffset, rowOffset, gridLength) {
    let length = problem.length;
    let gridPresent = new NumberOccurance(length);
    
    for (let row=0; row<gridLength; row++) {
        for (let col=0; col<gridLength; col++) {
            let value = problem[row+rowOffset][col+colOffset];
            if (value < 1 || value > length)
                return false;
            gridPresent.set(value);
        }
    }
    return !gridPresent.isNumberMissing();
}

function checkGrids(problem)
{
    let length = problem.length;
    let gridLength = Math.sqrt(length);
    
    for (let colOffset = 0; colOffset < length; colOffset += gridLength) {
        for (let rowOffset = 0; rowOffset < length; rowOffset += gridLength) {
            if ( ! gridPassed(problem, colOffset, rowOffset, gridLength) )
                return false;       
        }
    }
    return true;
}


////////////////////////////////////////////////////////////////////////////////////////////
main();