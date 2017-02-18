"use strict";

// Google jam challenge "(E) Ignore All My Comments"
// https://code.google.com/codejam/contest/2929486/dashboard#s%3Dp0&s=p4
// Author: Aspallar
//
// Problem
//
// Good programmers write fabulous comments. Igor is a programmer and he likes the old C-style comments
// in /* ... */ blocks. For him, it would be ideal if he could use this style as a uniform comment
// format for all programming languages or even documents, for example Python, Haskell or HTML/XML documents. 
//
// Making this happen doesn't seem too difficult to Igor. What he will need is a comment 
// pre-processor that removes all the comment blocks in /*, followed by comment text, and by another */.
// Then the processed text can be handed over to the compiler/document renderer to which it
// belongs—whatever it is. 
//
// Igor's pre-processor isn't quite that simple, though. Here are some cool things it does: 
// •The comments the pre-processor reads can be nested the same way brackets are nested in most 
//  programming languages. It's possible to have comments inside comments. For example, the following
//  code block has an outer level of comments that should be removed by the comment pre-processor.
//  The block contains two inner comments. printf("Hello /* a comment /* a comment inside comment */ 
//  inside /* another comment inside comment */ string */ world");
//  After the pre-process step, it becomes: printf("Hello  world");
//
// •Igor recognizes comments can appear anywhere in the text, including inside a string
//  "/*...*/", a constant number 12/*...*/34 or even in a character escape \/*...*/n 
//  Or more formally: 
//  text:
//    text-piece
//    text-piece remaining-text
//  text-piece:
//    char-sequence-without-/*
//    empty-string
//  remaining-text:
//    comment-block text
//  comment-block:
//    /* comment-content */
//  comment-content:
//    comment-piece
//    comment-piece remaining-comment
//  comment-piece:
//    char-sequence-without-/*-or-*/
//    empty-string
//  remaining-comment:
//    comment-block comment-content
//  char:
//    letters
//    digits
//    punctuations
//    whitespaces
//
// Our pre-processor, given a text, removes all comment-block instances as specified.
//
// Notes
// •Igor only needs to remove the comment in one pass. He doesn't remove additional comment blocks created 
// as a result of the removal of any comment block. For example: //*no recursion*/* file header */
// should generate: /* file header */
//
// •The * character in any /* or /*cannot be re-used in another /* or */. For example the following
// does NOT form a proper comment block /*/
//
// Input
// A text document with comment blocks in /* and */. The input file is valid. It follows the
// specification of text in the problem statement. The input file always terminates with a newline symbol. 
//
// Output
// We only have one test case for this problem. First we need to output the following line. 
// Case #1:
// Then, print the document with all comments removed, in the way specified in the problem 
// statements. Don't remove any spaces or empty lines outside comments. 
//
// Limits
// The input program contains only: 
// •Letters: a-z, A-Z,  
// •Digits: 0-9 
// •Punctuation: ~ ! @ # % ^ & * ( ) - + = : ; " ' < > , . ? | / \ { } [ ] _ 
// •Whitespace characters: space, newline 
//
// Small dataset
// The small input contains a program of less than 2k bytes. 
//
// Large dataset
// The large input contains a program of less than 100k bytes. 
////////////////////////////////////////////////////////////////////////////////////////////

var split = require("split");
var util = require("util");
var fs = require("fs");
var Transform = require("stream").Transform;

function main() {
    let inputStream = (process.argv.length === 3) ? fs.createReadStream(process.argv[2]) : process.stdin;
    process.stdout.write("Case #1:\n");
    inputStream.setEncoding("ascii")
        .pipe(new PreprocessorStream())
        .pipe(process.stdout);
}

///////////////////////////////////////////////////////////////////////////////////////////
// PreprocessorStream

function PreprocessorStream () {
    Transform.call(this);

	this.commentDepth = 0;
	this.previousCh = "";
}
util.inherits(PreprocessorStream, Transform);

PreprocessorStream.prototype._transform = function (chunk, encoding, cbDone) {
    let k, ch, output = "";
    
    for (k=0; k<chunk.length; k++) {
        ch = String.fromCharCode(chunk[k]);
        if (ch === "*" && this.previousCh === "/") {
            ++this.commentDepth;
            this.previousCh = "";
        } else if (ch === "/" && this.previousCh === "*" && this.commentDepth > 0) {
            --this.commentDepth;
            this.previousCh = "";
        } else {
            if (this.commentDepth === 0) {
                output += this.previousCh;
            }
            this.previousCh = ch; 
        }
    }
	this.push(output);
    cbDone();
};

PreprocessorStream.prototype._flush = function (cbDone) {
    if (this.commentDepth === 0 && this.previousCh != "") {
        this.push(this.previousCh);
    }
    cbDone();
}

////////////////////////////////////////////////////////////////////////////////////////////
main();