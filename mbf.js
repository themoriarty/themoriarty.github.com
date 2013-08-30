function getInputs(idx, nVars){
    var ret = new Array();
    for (var i = 0; i < nVars; ++i){
	ret.push(Math.floor(idx / Math.pow(2, i)) % 2);
    }
    return ret.reverse()
}

function combineTwoMidterms(term1, term2){
    var diffAt = -1;
    for (var i = 0; i < term1.inputs.length; ++i){
	if (term1.inputs[i] != term2.inputs[i]){
	    if (diffAt != -1){
		return false; // more than 1 diff
	    }
	    diffAt = i;
	}
    }
    if (diffAt != -1){
	var ret = new Midterm(term1.idx.concat(term2.idx), []);
	for (var i = 0; i < term1.inputs.length; ++i){
	    if (i != diffAt){
		ret.inputs.push(term1.inputs[i]);
	    } else{
		ret.inputs.push('-');
	    }
	}
	return ret;
    }
    return term1;
}

function combineMidterms(midterms){
    var ret = new Array();
    var combinedSome = true;
    while (combinedSome){
	var combined = new Object();
	var tmp = new Array();
	combinedSome = false;
	for (var i = 0; i < midterms.length; ++i){
	    for (var j = i + 1; j < midterms.length; ++j){
		var combination = combineTwoMidterms(midterms[i], midterms[j]);
		if (combination){
		    tmp.push(combination);
		    combined[i] = combined[j] = true;
		    combinedSome = true;
		}
	    }
	}
	for (var i in midterms){
	    if (!combined[i]){
		ret.push(midterms[i]);
	    }
	}
	midterms = tmp;
    }
    return ret;
}

function Midterm(idx, inputs){
    this.idx = idx;
    this.inputs = inputs;
}
Midterm.prototype.toString = function(){
    return "m(" + this.idx + ") " + this.inputs;
}

function purgeOverlapping(midterms){
    var terms = new Object();
    for (var i in midterms){
	var midterm = midterms[i];
	for (var j in midterm.idx){
	    if (!terms[midterm.idx[j]]){
		terms[midterm.idx[j]] = {done: false, terms: new Array()};
	    }
	    terms[midterm.idx[j]].terms.push(midterm);
	}
    }
    function allDone(ts){
	for (var k in ts){
	    if (!ts[k].done){
		return false;
	    }
	}
	return true;
    }
    var ret = new Array();
    while (!allDone(terms)){
	console.log(terms);
	var candidates = new Array();
	for (var k in terms){
	    if (!terms[k].done){
		candidates.push({idx: k, terms: terms[k].terms});
	    }
	}
	candidates.sort(function(x) {return x.terms.length;});
	candidates = candidates[0].terms;
	candidates.sort(function(term) {
	    var ret = 0;
	    for (var i in term.idx){
		if (!terms[term.idx[i]].done){
		    ret--;
		}
	    }
	    return ret;
	});
	for (var i in candidates[0].idx){
	    terms[candidates[0].idx[i]].done = true;
	}
	ret.push(candidates[0]);
    }
    return ret;
}

function printVar(idx, value, useXs){
    return (value == 0 ? "\u00AC" : "") + (useXs ? "x" + (idx * 1 + 1) : String.fromCharCode("A".charCodeAt(0) + idx * 1));
}

function serialize(midterms, useDnf){
    var ret = "";
    if (useDnf){
	for (var i in midterms){
	    if (i != 0){
		ret += " + ";
	    }
	    var midterm = midterms[i];
	    for (var j in midterm.inputs){
		if (midterm.inputs[j] != '-'){
		    ret += printVar(j, midterm.inputs[j], true);
		}
	    }
	}
    } else{
	for (var i in midterms){
	    var midterm = midterms[i];
	    var term = "";
	    for (var j in midterm.inputs){
		if (midterm.inputs[j] != '-'){
		    if (term.length > 0){
			term += " + ";
		    }
		    term += printVar(j, !midterm.inputs[j], true);
		}
	    }
	    ret += "(" + term + ")";
	}
    }
    return ret;
}

function Expression(ops){
    this.ops = ops;
}
Expression.prototype.toString = function(){
    var ret = "";
    for (var e in this.ops){
	/*if (this.ops[e] != '*')*/{
	    ret += this.ops[e].toString();
	    ret += " ";
	}
	ret = ret.trimRight();
    }
    return this.ops.length > 2 ? "(" + ret + ")" : ret;
}
/*
Expression.prototype.getAllMultipliers = function(){
    for (var i in this.ops){
	if (this.ops[i] == '+'){
	    return new Array();
	}
    }
    var op1 = this.ops[0];
    var remainingOps = new Array();
    for (var i = 2; i < this.ops.length; ++i){
	remainingOps.push(this.ops[i]);
    }
    var ret = new Expression(remainingOps).getAllMultipliers();
    var retLen = ret.length;
    for (var i = 0; i < retLen; ++i){
	var newOp = new Expression(new Array());
	for (var j in ret[i].ops){
	    
	}
    }
}*/
Expression.prototype.addBrackets = function(){
    
}

function getExpression(midterms, isDnf){
    var ops = new Array();
    for (var i in midterms){
	if (ops.length > 0){
	    ops.push(isDnf ? "+" : "*");
	}
	var op = new Expression(new Array());
	var midterm = midterms[i];
	for (var j in midterm.inputs){
	    var input = midterm.inputs[j];
	    if (input != '-'){
		if (op.ops.length > 0){
		    op.ops.push(isDnf ? "*" : "+");
		}
		op.ops.push(((input == 1 && isDnf) || (input == 0 && !isDnf) ? "" : "\u00AC") + "x" + (j * 1 + 1));
	    }
	}
	ops.push(op);
    }
    return new Expression(ops);
}

function solve(outputs, useDnf){
    if (Math.pow(2, Math.ceil(Math.log(outputs.length) / Math.log(2))) != outputs.length){
	throw ("Неправильное количество выходов: " + outputs.length);
    }
    var nVars = Math.log(outputs.length) / Math.log(2);
    var midterms = new Array();
    for (var i in outputs){
	if (outputs[i] == (useDnf ? 1 : 0)){
	    midterms.push(new Midterm([i], getInputs(i, nVars)));
	}
    }
    for (var i in midterms){
	console.log(i, midterms[i].toString());
    }
    midterms = combineMidterms(midterms);
    console.log("combined");
    for (var i in midterms){
	console.log(midterms[i].toString());
    }
    midterms = purgeOverlapping(midterms);
    console.log("purged");
    for (var i in midterms){
	console.log(midterms[i].toString());
    }
    console.log(serialize(midterms, useDnf));
    return getExpression(midterms, useDnf);
}

function output(text){
    var p = document.createElement("p");
    p.innerText = text;
    document.getElementById("output").appendChild(p);
}

function main(){
    try{
	var text = document.getElementById("inputs").value.replace(/[^01]/g, "");
	var outputs = new Array();
	for (var i in text){
	    outputs.push({'0': 0, '1': 1}[text[i]]);
	}
	solutionDnf = solve(outputs, true);
	solutionCnf = solve(outputs, false);
	output("Выходы: [" + outputs.join(" ") + "], решение: " + solutionDnf.toString() + " или " + solutionCnf.toString());
    } catch (err){
	output(err);
    }
}
//console.log(getInputs(13, 4));
//console.log(solve([0, 0, 0, 0, 1, 0, 0, 0, 1, 1, 1, 1, 1, 0, 1, 1], true).toString());
//console.log(solve([0, 1, 0, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0]))
