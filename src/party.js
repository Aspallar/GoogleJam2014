"use strict";

// Google Jam challenge "(B) Meet and Party"
// https://code.google.com/codejam/contest/2929486/dashboard#s=p1
// Author: Aspallar
//
// Problem
// Little Sin lives in a Manhattan-grid city, a 2D plane where people can only go north, west, south 
// or east along the grid. The distance from (x1, y1) to (x2, y2) is |x1 - x2| + |y1 - y2|.
//
// Little Sin really likes to party and is hoping to host a house party in Manhattan this Sunday.
// Little Sin has collected a list of people who will attend, and now needs to decide at whose home
// she will host the party. 
//
// Little Sin invited all of the people in several rectangular areas, and all of those people have said yes.
// A rectangular area is denoted as (x1, y1, x2, y2), where x1 ≤ x2, y1 ≤ y2.
// People who live in a rectangular area fill all integral points inside it.
// So there are a total of (x2 - x1 + 1) * (y2 - y1 + 1) people in the rectangular area (x1, y1, x2, y2). 
//
// Little Sin knows the coordinates of those rectangular areas. She wants the party to be hosted at the home
// of one of the people who is attending, but she also doesn't want everyone else to have to travel very far:
// she wants to minimize the sum of all distances from all attendees' houses to the party. Can you help her?
//
// Input
// The first line of the input gives the number of test cases, T. T test cases follow.
// Each test case starts with a line containing a single integer: the number of rectangular areas, B. B lines follow.
// Each line contains 4 integers: x1, y1, x2, y2, denoting the coordinates of a rectangular area of people 
// Little Sin has invited to her party. 
//
// Output
// For each test case, output one line containing "Case #t: x y d", where t is the case number (starting from 1)
// and (x, y) is the coordinates of the person whose home the party should be hosted. If there are multiple
// positions with the same minimum total distance, choose the one with the smallest x.
// If there are still multiple positions, choose the one with the smallest y.
// The value d is the sum of the distances from all attendees' houses to the point (x, y). 
//
// Limits
// 1 ≤ T ≤ 10.
// |x1|, |y1|, |x2|, |y2| ≤ 10e9.
// x1 ≤ x2, y1 ≤ y2.
// The rectangular areas within a test case don't intersect. 
//
// Small dataset
// 1 ≤ B ≤ 100.
// 1 ≤ Total number of people in each test case ≤ 1000. 
//
// Large dataset
// 1 ≤ B ≤ 1000.
// 1 ≤ Total number of people in each test case ≤ 1000000. 
///////////////////////////////////////////////////////////////////////////////////////////
// Notes
//
// second attempt at problem B. 1st attempt (party.js) was too slow for large dataset.
// this one passes on the large test, dataset taking 5.29 minutes on my PC.

var split = require("split");
var util = require("util");
var fs = require("fs");
var stream = require("stream");
var Transform = stream.Transform;
var startTime = new Date().getTime();

function main() {
    var inputStream = (process.argv.length >= 3) ? fs.createReadStream(process.argv[2]) : process.stdin;
    inputStream.setEncoding("ascii")
        .pipe(split())
        .pipe(new CaseParserStream())
        .pipe(new DistanceCalculatorStream())
        .pipe(new FormatResultsStream())
        .pipe(process.stdout);
}


///////////////////////////////////////////////////////////////////////////////////////////
// Solution
function Solution() {
    this.x = this.y = 0;
    this.distance = Infinity;
}

Solution.prototype.set = function (x, y, d) {
    this.x = x;
    this.y = y;
    this.distance = d;
};

Solution.prototype.tostring = function () {
    return `${this.x} ${this.y} ${this.distance}`;
};

Solution.prototype.isBetter = function (x, y, d) {
    if (d < this.distance)
        return true;
    return (d === this.distance) && ((x < this.x) || (x === this.x && y < this.y))
};


///////////////////////////////////////////////////////////////////////////////////////////
// Region
function Region(x1, y1, x2, y2) {
    this.x1 = x1;
    this.y1 = y1;
    this.x2 = x2;
    this.y2 = y2;
}

Region.prototype.width = function () {
    return (this.x2 - this.x1) + 1;
};

Region.prototype.height = function () {
    return (this.y2 - this.y1) + 1;
};

Region.prototype.xDistanceTo = function (xDest) {
    var dist = 0;
    for (var x = this.x1; x <= this.x2; x++) {
        dist += Math.abs(xDest - x);
    }
    return dist * this.height();
};

Region.prototype.yDistanceTo = function (yDest) {
    var dist = 0;
    for (var y = this.y1; y <= this.y2; y++) {
        dist += Math.abs(yDest - y);
    }
    return dist * this.width();
};


///////////////////////////////////////////////////////////////////////////////////////////
// CaseParserStream

function CaseParserStream () {
    Transform.call(this, { objectMode: true });

    this.regions = null;
    this.numRegions = 0;
    this.firstLine = true;
}
util.inherits(CaseParserStream, Transform);

CaseParserStream.prototype._transform = function (line, encoding, cbDone) {
    if (this.firstLine) {
        // line contains total number of cases: ignore it
        this.firstLine = false;
    }
    else if (this.numRegions === 0) {
        // line contains number of regions: start a new case
        this.numRegions = +line;
        this.regions = [];
    }
    else {
        // line contains a region: add it to regions
        var numbers = line.split(" ");
        var region = new Region(+numbers[0], +numbers[1], +numbers[2], +numbers[3]);
        this.regions.push(region); 

        if (--this.numRegions === 0) {
            // last line of case reached: add regions to the output stream
            this.push(this.regions);
        }
    }
    cbDone();
};

///////////////////////////////////////////////////////////////////////////////////////////
// DistanceCalculatorStream

function DistanceCalculatorStream () {
    Transform.call(this, { objectMode: true });
}
util.inherits(DistanceCalculatorStream, Transform);



DistanceCalculatorStream.prototype._transform = function (regions, encoding, cbDone) {

    var party, firstx, firsty;
    var xDistances = [];
    var yDistances = [];

    firstx = calcXDistances(regions, xDistances);
    firsty = calcYDistances(regions, yDistances);
    party = findPartyLocation(regions, xDistances, yDistances, firstx, firsty);
    this.push(party);
    cbDone();

    function calcYDistances(regions, yDistances) {

        var y, firsty, dist, k;
        var len = regions.length;

        regions.sort( (a, b) => {return a.y1 - b.y1 } );
        firsty = y = regions[0].y1;

        regions.forEach( r => {
            if (r.y1 > y)
                y = r.y1;
            for (; y<=r.y2; y++) {
                dist = 0;
                for (k=0; k<len; k++)
                    dist += regions[k].yDistanceTo(y);
                yDistances[y-firsty] = dist;
            }
        });
        return firsty;
    }

    function calcXDistances(regions, xDistances) {

        var x, firstx, dist, k;
        var len = regions.length;

        regions.sort( (a, b) => {return a.x1 - b.x1 } );
        firstx = x = regions[0].x1;

        regions.forEach( r => {
            if (r.x1 > x)
                x = r.x1;
            for (; x<=r.x2; x++) {
                dist = 0;
                for (k=0; k<len; k++)
                    dist += regions[k].xDistanceTo(x);
                xDistances[x-firstx] = dist;
            }
        });
        return firstx;
    }

    function findPartyLocation(regions, xDistances, yDistances, firstx, firsty) {
        var regionIndex, x, y, r, x, xDist, totalDistance;
        var len = regions.length;
        var solution = new Solution();

        for (regionIndex=0; regionIndex<len; regionIndex++) {
            r = regions[regionIndex];
            for (x = r.x1; x <= r.x2; x++) {
                xDist = xDistances[x-firstx];
                for (y = r.y1; y <= r.y2; y++) {
                    totalDistance = xDist + yDistances[y-firsty];
                    if ( solution.isBetter(x, y, totalDistance))
                        solution.set(x, y, totalDistance);
                }
            }
        }
        return solution;
    }



};

////////////////////////////////////////////////////////////////////////////////////////////
// FormatResultsStream

function FormatResultsStream () {
    Transform.call(this, { objectMode: true });
    this.caseNumber = 0;
}
util.inherits(FormatResultsStream, Transform);

FormatResultsStream.prototype._transform = function (solution, encoding, cbDone) {
    this.push(`Case #${++this.caseNumber}: ${solution.tostring()}\n`);
    cbDone();
};

FormatResultsStream.prototype._flush = function (cbDone) {
    if (process.argv.length === 4 && process.argv[3].toLowerCase() === "time") {
        var time = (new Date().getTime() - startTime) / 1000;
        this.push(`Time taken ${time} seconds. (${time / 60} mins.)`);
    }
    cbDone();
};


////////////////////////////////////////////////////////////////////////////////////////////
main();