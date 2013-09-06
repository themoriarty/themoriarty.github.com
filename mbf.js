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
	ret.idx.sort();
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
    var aaa = 0;
    while (combinedSome /* && midterms.length*/){
	var combined = new Object();
	var tmp = new Array();
	combinedSome = false;
	for (var i = 0; i < midterms.length; ++i){
	    for (var j = i + 1; j < midterms.length; ++j){
		var combination = combineTwoMidterms(midterms[i], midterms[j]);
		if (combination){
		    console.log("combined", midterms[i].toString(), midterms[j].toString(), ' -> ', combination.toString());
		    if (tmp.filter(function(t){
			if (t.idx.length != combination.idx.length){
			    return false;
			}
			for (var i in t.idx){
			    if (t.idx[i] != combination.idx[i]){
				return false;
			    }
			}
			return true;
		    }).length == 0)
		    {
			tmp.push(combination);
		    }
		    combined[i] = combined[j] = true;
		    console.log(i, combined[i], j, combined[j]);
		    combinedSome = true;
		}
	    }
	}
	for (var i = 0; i < midterms.length; ++i){
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
Expression.prototype.toString = function(topLevel){
    var ret = "";
    for (var e in this.ops){
	/*if (this.ops[e] != '*')*/{
	    a = this;
	    if (this.ops[e].toString() != '*'){
		ret += this.ops[e].toString();
	    }
	    ret += " ";
	}
	ret = ret.trimRight();
    }
    var needBrackets = !topLevel && this.ops.length > 2 && this.ops.filter(function(x) {return x == '+'}).length != 0;
    return needBrackets ? "(" + ret + ")" : ret;
}
Expression.prototype.clone = function(){
    var newOps = new Array();
    this.ops.forEach(function(x) {newOps.push(x)});
    return new Expression(newOps);
}
function addIfNeeded(ret, m){
    if (ret.filter(function(x) {return x == m}).length == 0){
	ret.push(m);
    }
}
Expression.prototype.getAllMultipliers = function(){
    for (var i in this.ops){
	if (this.ops[i] == '+'){
	    return new Array();
	}
    }
    var ret = new Array();
    for (var i in this.ops){
	var op = this.ops[i];
	if (op == '*'){
	    continue;
	}
	var otherOps = this.ops.filter(function(value, idx){
	    return (idx != i && idx != i * 1 + 1);
	});
	addIfNeeded(ret, new Expression([op]));
	if (otherOps.length > 0){
	    var otherMultipliers = new Expression(otherOps).getAllMultipliers();
	    for (var j in otherMultipliers){
		var multiplier = otherMultipliers[j];
		addIfNeeded(ret, multiplier);
		var newExp = multiplier.clone();
		newExp.ops.push('*');
		newExp.ops.push(op);
		addIfNeeded(ret, newExp);
	    }
	}
	break; // process only head
    }
    return ret;
}
function eq(a1, a2){
    return a1.length == a2.length && a1.filter(function(v, i){return a2[i] != v}).length == 0;
}
function divide(x, y){
    var ret = new Expression(new Array());
    for (var i = 0; i < x.ops.length; ++i){
	if (y.ops.filter(function(op) {return op == x.ops[i]}).length == 0){
	    ret.ops.push(x.ops[i]);
	} else{
	    ++i;
	}
    }
    return ret;
}
function addBracketsImpl(exp){
    var ops = exp.ops;
    var multipliers = new Array();
    ops.forEach(function(op){
	if (op != '+'){
	    op.getAllMultipliers().forEach(function(m){
		multipliers.push(m);
	    });
	}
    });
    multipliers.sort(function(m1, m2){
	var m1l = multipliers.filter(function(x) {return eq(x.ops, m1.ops)}).length;
	var m2l = multipliers.filter(function(x) {return eq(x.ops, m2.ops)}).length;
	return m2l - m1l;
    });
    if (multipliers.length > 0 && multipliers.filter(function(x) {return eq(x.ops, multipliers[0].ops)}).length > 1){
	var best = multipliers[0];
	var ret = new Expression(new Array().concat(best.ops));
	ret.ops.push('*');
	var d = new Expression(new Array());
	var r = new Expression(new Array());
	for (var i in ops){
	    if (ops[i] == '+'){
		continue;
	    }
	    var d1 = divide(ops[i], best);
	    //console.log(ops[i].toString(), ' / ', best.toString(), ' = ', d1.toString());
	    if (d1.ops.length == ops[i].ops.length){
		if (r.ops.length != 0) {r.ops.push('+')};
		r.ops.push(ops[i]);
	    } else{
		if (d.ops.length != 0) {d.ops.push('+')};
		d.ops.push(d1);
	    }
	}
	if (d.ops.length == 0){
	    return exp;
	}
	ret.ops.push(addBracketsImpl(d));
	if (r.ops.length > 0){
	    ret.ops.push('+');
	    ret.ops.push(addBracketsImpl(r));
	}
	console.log(ret.toString());
	return ret;
    } else{
	return exp;
    }
}
Expression.prototype.addBrackets = function(){
    return addBracketsImpl(this);
    var newOps = new Array();
    var tmp = new Array();
    for (var i = 0; i < this.ops.length; ++i){
	if (this.ops[i] != '*'){
	    tmp.push(this.ops[i]);
	} else{
	    newOps = newOps.concat(tmp);
	    newOps.push(this.ops[i]);
	    newOps.push(this.ops[++i]);
	    tmp = new Array();
	}
    }
    newOps = newOps.concat(addBracketsImpl(tmp));
    return new Expression(newOps);
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
    p.textContent = text;
    document.getElementById("output").appendChild(p);
}
function clean(){
    document.getElementById("output").innerHTML = "";
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
	output("Выходы: [" + outputs.join(" ") + "], решение: " + solutionDnf.addBrackets().toString(true) + " или " + solutionCnf.toString());
    } catch (err){
	output(err);
    }
}
//new Expression([10, '*', 20, '*', 30]).getAllMultipliers().forEach(function(x) {console.log(x.toString())})
//0000100100001001
//console.log(getInputs(13, 4));
//console.log(solve([0, 0, 0, 0, 1, 0, 0, 0, 1, 1, 1, 1, 1, 0, 1, 1], true));
//console.log(solve([0, 0, 0, 0, 1, 0, 0, 0, 1, 1, 1, 1, 1, 0, 1, 1], true).ops[2].getAllMultipliers());
//solve([0, 0, 0, 0, 1, 0, 0, 0, 1, 1, 1, 1, 1, 0, 1, 1], true).ops[2].getAllMultipliers().forEach(function(x) {console.log(x.toString())})
console.log(solve([0, 0, 0, 0, 1, 0, 0, 0, 1, 1, 1, 1, 1, 0, 1, 1], true).addBrackets().toString(true));
//console.log(solve([0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 1], true).addBrackets().toString());
//console.log(solve([0, 1, 0, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0]))
