"use strict";

// Google Jam challenge "(D) Dragon Maze"
// https://code.google.com/codejam/contest/2929486/dashboard#s=p3
// Author: Aspallar
//
// Problem
// You are the prince of Dragon Kingdom and your kingdom is in danger of running out of power.
// You must find power to save your kingdom and its people. An old legend states that power
// comes from a place known as Dragon Maze. Dragon Maze appears randomly out of nowhere without
// notice and suddenly disappears without warning. You know where Dragon Maze is now, so it is
// important you retrieve some power before it disappears. 
//
// Dragon Maze is a rectangular maze, an N x M grid of cells. The top left corner cell of the
// maze is (0,0) and the bottom right corner is (N-1, M-1). Each cell making up the maze can be
// either a dangerous place which you never escape after entering, or a safe place that contains
// a certain amount of power. The power in a safe cell is automatically gathered once you enter
// that cell, and can only be gathered once. Starting from a cell, you can walk up/down/left/right
// to adjacent cells with a single step. 
//
// Now you know where the entrance and exit cells are, that they are different, and that they are
// both safe cells. In order to get out of Dragon Maze before it disappears, you must walk from
// the entrance cell to the exit cell taking as few steps as possible. If there are multiple
// choices for the path you could take, you must choose the one on which you collect as much power
// as possible in order to save your kingdom. 
//
// Input
// The first line of the input gives the number of test cases, T. T test cases follow. 
// Each test case starts with a line containing two integers N and M, which give the size of Dragon
// Maze as described above. The second line of each test case contains four integers
// enx, eny, exx, exy, describing the position of entrance cell (enx, eny) and exit cell (exx, exy).
// Then N lines follow and each line has M numbers, separated by spaces, describing the N x M cells
// of Dragon Maze from top to bottom. Each number for a cell is either -1, which indicates a cell
// is dangerous, or a positive integer, which indicates a safe cell containing a certain amount of power. 
//
// Output
// For each test case, output one line containing "Case #x: y", where x is the case number (starting
// from 1). If it's possible for you to walk from the entrance to the exit, y should be the maximum
// total amount of power you can collect by taking the fewest steps possible. If you cannot walk from
// the entrance to the exit, y should be the string "Mission Impossible." (quotes for clarity).
// Please note that the judge requires an exact match, so any other output like "mission impossible." or
// "Mission Impossible" (which is missing the trailing period) will be judged incorrect. 
//
// Limits
// The amount of power contained in each cell will not exceed 10,000.
//  1 ≤ T ≤ 30.
//  0 ≤ enx, exx < N.
//  0 ≤ eny, exy < M.
//
// Small dataset
// 1 ≤ N, M ≤ 10.
//
// Large dataset
// 1 ≤ N, M ≤ 100.

var split = require("split");
var util = require("util");
var fs = require("fs");
var stream = require("stream");
var Transform = stream.Transform;

function main() {
    let inputStream = (process.argv.length === 3) ? fs.createReadStream(process.argv[2]) : process.stdin;
    inputStream.setEncoding("ascii")
        .pipe(split())
        .pipe(new CaseParserStream())
        .pipe(new MazeSolverStream())
        .pipe(new FormatResultsStream())
        .pipe(process.stdout);
}

///////////////////////////////////////////////////////////////////////////////////////////
// 
function Point(x, y) {
    this.x = x || 0;
    this.y = y || 0;
}

function DragonMaze() {
    this.maze = [];
    this.m = 0;
    this.n = 0;
    this.start = null; // Point
    this.end = null; // Point
}

DragonMaze.prototype.walkable = function (x, y) {
    return x >= 0 &&
           y >= 0 &&
           x < this.n &&
           y < this.m &&
           this.maze[x][y] != -1;
}

DragonMaze.prototype.isExit = function (point) {
    return point.x === this.end.x && point.y === this.end.y;
}

///////////////////////////////////////////////////////////////////////////////////////////
// CaseParserStream

function CaseParserStream () {
    Transform.call(this, { objectMode: true });

	this.firstLine = true;
	this.lines = 0;
    this.maze = null; // DragonMaze
}
util.inherits(CaseParserStream, Transform);

CaseParserStream.prototype._transform = function (line, encoding, cbDone) {
    if (this.firstLine) {
        this.firstLine = false;
    }
    else if (this.lines === 0) {
        let m = this.maze = new DragonMaze();
        let numbers = line.split(" ");
        m.n = this.lines = +numbers[0];
        m.m = +numbers[1];
    }
    else if (this.maze.start === null) {
        let numbers = line.split(" ");
        let m = this.maze;
        m.start = new Point(+numbers[0], +numbers[1]);
        m.end = new Point(+numbers[2], +numbers[3]);
    }
    else {
        let numbers = line.split(" ");
        numbers.forEach( (n, i, a) => {a[i] = +n});
        this.maze.maze.push(numbers);
        if (--this.lines === 0) {
            this.push(this.maze);
            this.maze = null;
        }
    }
    cbDone();
};

///////////////////////////////////////////////////////////////////////////////////////////
// MazeSolverStream

function MazeSolverStream () {
    Transform.call(this, { objectMode: true });
}
util.inherits(MazeSolverStream, Transform);


MazeSolverStream.prototype._transform = function (dragonMaze, encoding, cbDone) {
    var deltaX = [0, 0, 1, -1];
    var deltaY = [1, -1, 0 ,0];
    var power = [];
    var q = [];
    var foundExit = false;
    var x, y, pt, direction, thisPower;

    for (x=0; x<dragonMaze.n; x++) {
        power.push(new Array(dragonMaze.m).fill(-1));
    }

    q.push(dragonMaze.start);
    power[dragonMaze.start.x][dragonMaze.start.y] = 0;

    while ( q.length > 0 ) {
        pt = q.shift();

        // console.dir(power);

        thisPower = power[pt.x][pt.y] + dragonMaze.maze[pt.x][pt.y];

        if ( dragonMaze.isExit(pt) ) {
            foundExit = true;
            break;
        }

        for (direction=0; direction<4; direction++) {

            x = pt.x + deltaX[direction];
            y = pt.y + deltaY[direction];
            
            if ( dragonMaze.walkable(x, y) ) {

                if ( power[x][y] === -1 ) {

                    power[x][y] = thisPower;
                    q.push(new Point(x, y));

                } else if ( thisPower > power[x][y] ) {

                    power[x][y] = thisPower;

                }

            }
        }
    }
    this.push({
        success: foundExit,
        power: thisPower
    });

    cbDone();
}

////////////////////////////////////////////////////////////////////////////////////////////
// FormatResultsStream

function FormatResultsStream () {
    Transform.call(this, { objectMode: true });
    this.caseNumber = 0;
}
util.inherits(FormatResultsStream, Transform);

FormatResultsStream.prototype._transform = function (result, encoding, cbDone) {
    var out = result.success ? result.power : "Mission Impossible.";
    this.push(`Case #${++this.caseNumber}: ${out}\n`);
    cbDone();
};


////////////////////////////////////////////////////////////////////////////////////////////
main();
