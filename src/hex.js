"use strict";

// Google Jam challenge "(C) Hex"
// https://code.google.com/codejam/contest/2929486/dashboard#s=p2
// Author: Aspallar
//
// Problem
// This problem was inspired by a board game called Hex, designed independently by Piet Hein and John Nash.
// It has a similar idea, but does not assume you have played Hex.
//
// This game is played on an NxN board, where each cell is a hexagon. There are two players: Red side (using
// red stones) and Blue side (using blue stones). The board starts empty, and the two players take turns
// placing a stone of their color on a single cell within the overall playing board. Each player can place
// their stone on any cell not occupied by another stone of any color. There is no requirement that a stone
// must be placed beside another stone of the same color. The player to start first is determined randomly
// (with probability among the two players).
//
// The upper side and lower sides of the board are marked as red, and the other two sides are marked as blue.
// The goal of the game is to form a connected path of one player's stones connecting the two sides of the
// board that have that player's color. The first player to achieve this wins. Note that the four corners
// are considered connected to both colors.
//
//  The game ends immediately when one player wins.
//
// Given a game state, help someone new to the game determine the status of a game board.
// Say one of the following: 
// •"Impossible": If it was impossible for two players to follow the rules and to have arrived at that game state.
// •"Red wins": If the player playing the red stones has won.
// •"Blue wins": If the player playing the blue stones has won.
// •"Nobody wins": If nobody has yet won the game. Note that a game of Hex can't end without a winner!
//
// Note that in any impossible state, the only correct answer is "Impossible", even if red or blue has
// formed a connected path of stones linking the opposing sides of the board marked by his or her colors. 
//
// Input
// The first line of input gives the number of test cases, T. T test cases follow. Each test case
// start with the size of the side of the board, N. This is followed by a board of N rows and N columns
// consisting of only 'B', 'R' and '.' characters. 'B' indicates a cell occupied by blue stone,
// 'R' indicates a cell occupied by red stone, and '.' indicates an empty cell. 
//
// Output
// For each test case, output one line containing "Case #x: y", where x is the case number (starting
// from 1) and y is the status of the game board. It can be "Impossible", "Blue wins", "Red wins" or
// "Nobody wins" (excluding the quotes). Note that the judge is case-sensitive, so answers of
// "impossible", "blue wins", "red wins" and "nobody wins" will be judged incorrect. 
//
// Limits
// 1 ≤ T ≤ 100. 
//
// Small dataset
// 1 ≤ N ≤ 10. 
//
// Large dataset
// 1 ≤ N ≤ 100. 


var split = require("split");
var util = require("util");
var fs = require("fs");
var stream = require("stream");
var Transform = stream.Transform;
var startTime = new Date();

function main() {
    let inputStream = (process.argv.length >= 3) ? fs.createReadStream(process.argv[2]) : process.stdin;
    inputStream.setEncoding("ascii")
        .pipe(split())
        .pipe(new CaseParserStream())
        .pipe(new GameAnalyserStream())
        .pipe(new FormatResultsStream())
        .pipe(process.stdout);
}

///////////////////////////////////////////////////////////////////////////////////////////
//

const Outcomes = {
    impossible: 0,
    blueWins: 1,
    redWins: 2,
    nobodyWins: 3,
    tostring: function (outcome) {
        switch (outcome)
        {
            case this.impossible: return "Impossible";
            case this.blueWins: return "Blue wins";
            case this.redWins: return "Red wins";
            case this.nobodyWins: return "Nobody wins";
            default: return "";
        }
    },
    isWinOutcome: function (outcome) {
        return outcome === this.blueWins || outcome === this.redWins;
    }
}

const directionOffsets = [ [0,1], [1,0], [1,-1], [0,-1], [-1,0], [-1,1] ];


function HexCoord (x, y) {
    this.x = x || 0;
    this.y = y || 0;
}

HexCoord.prototype.move = function (direction) {
        let offsets = directionOffsets[direction];
        return new HexCoord( this.x + offsets[0], this.y + offsets[1]);
}

///////////////////////////////////////////////////////////////////////////////////////////
// HexBoard
function HexBoard(size) {
	this.board = [];
    this.visited = [];
    this.length = size;
    this.marked = [];


    for (let i = 0; i < size; i++) {
        this.visited.push( new Array(size) );
        this.marked.push( new Array(size) );
    };
}

HexBoard.prototype.unmark = function () {
    for (let i = 0; i < this.marked.length; i++) {
        this.marked[i].fill(false);
    };
}

HexBoard.prototype.unvisit = function () {
    for (let i = 0; i < this.visited.length; i++) {
        this.visited[i].fill(false);
    };
}

HexBoard.prototype.push = function (rowDescription) {
	let row = rowDescription.split("");
	this.board.push(row);
}

HexBoard.prototype.isValidCoord = function (p) {
    let len = this.board.length;
    return p.x >= 0 && p.x < len && p.y >= 0 && p.y < len;
}


HexBoard.prototype.countCells= function (color) {
	let length = this.board.length;
	let count = 0;
	
	for (let x=0; x<length; x++) {
		for (let y=0; y<length; y++) {
			if (this.board[x][y] === color)
				++count;
		}
	}
	return count;
}

HexBoard.prototype.tryPath = function (color, hex) {

    if ( !this.isValidCoord(hex) ) {
        // edge of board reached, return true if we have a winner
        return (color === "B" && hex.y >= this.board.length)
            || (color === "R" && hex.x >= this.board.length);
    }

    if ( this.visited[hex.x][hex.y] ) {
        return false;
    }
    this.visited[hex.x][hex.y] = true;

    if (this.board[hex.x][hex.y] != color) {
        return false;
    }

    this.marked[hex.x][hex.y] = true;

    for (let direction=0; direction<6; direction++) {
        if ( this.tryPath(color, hex.move(direction)) )
            return true;
    }

    this.marked[hex.x][hex.y] = false;

    return false;
}

HexBoard.prototype.blueWins = function () {
    let start = new HexCoord(0,0);
    this.unvisit();
    this.unmark();

    for (start.x = 0; start.x < this.board.length; start.x++) {
        if ( this.tryPath("B", start) ) {
            return true;
        }
    }
    return false;
}

HexBoard.prototype.redWins = function () {
    let start = new HexCoord(0,0);
    this.unvisit();
    this.unmark();

    for (start.y = 0; start.y < this.board.length; start.y++) {
        if ( this.tryPath("R", start) )
            return true;
    }
    return false;
}

HexBoard.prototype.colorWins = function (color) {
    if (color === "B")
        return this.blueWins();
    else
        return this.redWins();
}

HexBoard.prototype.getPath = function () {
    let path = [];
    for (let k=0; k<this.length; k++)
        path.push(this.marked[k].slice());
    return path;
}

HexBoard.prototype.uniquePath = function (color, path) {
    for (let x = 0; x < this.length; x++) {
        for (let y = 0; y < this.length; y++) {
            if ( path[x][y] ) {
                this.board[x][y] = ".";
                let valid = !this.colorWins(color);
                this.board[x][y] = color;
                if (valid)
                    return true;
            }
        }
    }
    return false;
}


///////////////////////////////////////////////////////////////////////////////////////////
// CaseParserStream

function CaseParserStream () {
    Transform.call(this, { objectMode: true });

	this.firstLine = true;
	this.size = 0;
}
util.inherits(CaseParserStream, Transform);

CaseParserStream.prototype._transform = function (line, encoding, cbDone) {
    if (this.firstLine) {
        // line contains total number of cases: ignore it
        this.firstLine = false;
    }
    else if (this.size === 0) {
        // line contains number of regions: start a new case
        this.size = +line;
        this.board = new HexBoard(this.size);
    }
    else {
        // line contains a board row: add it to regions
        this.board.push(line);
        if (--this.size === 0) {
            // last line of case reached: add board to the output stream
            this.push(this.board);
        }
    }
    cbDone();
};

///////////////////////////////////////////////////////////////////////////////////////////
// GameAnalyserStream

function GameAnalyserStream () {
    Transform.call(this, { objectMode: true });
}
util.inherits(GameAnalyserStream, Transform);


GameAnalyserStream.prototype._transform = function (board, encoding, cbDone) {
	let result;
    let redCount = board.countCells("R");
    let blueCount = board.countCells("B");

    if ( Math.abs(redCount - blueCount) > 1 ) {

        result = Outcomes.impossible;

    } else if (blueCount < board.length && redCount < board.length) {

        result = Outcomes.nobodyWins;

    } else {

        result = this.findWinner(board);
        if (this.isImpossible(result, board, redCount, blueCount)) {
            result = Outcomes.impossible;
        }
    }

    this.push(result);
    cbDone();
}

GameAnalyserStream.prototype.findWinner = function (board) {
    if ( board.blueWins() ) {
        return Outcomes.blueWins;
    }
    if ( board.redWins() ) {
        return Outcomes.redWins;
    }
    return Outcomes.nobodyWins;
}

GameAnalyserStream.prototype.isImpossible = function(result, board, redCount, blueCount) {
    let color = (result === Outcomes.blueWins) ? "B" : "R";

    if ( result === Outcomes.redWins && blueCount > redCount)
        return true;
    
    if (result === Outcomes.blueWins && redCount > blueCount)
        return true;
    
    if (Outcomes.isWinOutcome(result) && !board.uniquePath(color, board.getPath())) {
        return true;
    }

    return false;
}
////////////////////////////////////////////////////////////////////////////////////////////
// FormatResultsStream

function FormatResultsStream () {
    Transform.call(this, { objectMode: true });
    this.caseNumber = 0;
}
util.inherits(FormatResultsStream, Transform);

FormatResultsStream.prototype._transform = function (result, encoding, cbDone) {
    let output = `Case #${++this.caseNumber}: ${Outcomes.tostring(result)}\n`;
    this.push(output);
    cbDone();
};

FormatResultsStream.prototype._flush = function (cbDone) {
    if (process.argv.length === 4 && process.argv[3].toLowerCase() === "time") {
        let time = (new Date() - startTime);
        this.push(`Time: ${time}ms\n${time / 1000}s`);
    }
    cbDone();
}


////////////////////////////////////////////////////////////////////////////////////////////
main();
