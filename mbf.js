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
    ret = new Array();
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
    return (value == 0 ? "\u00AC" : "") + (useXs ? "x" + idx : String.fromCharCode("A".charCodeAt(0) + idx * 1));
}

function serialize(midterms, useXs){
    var ret = "";
    for (var i in midterms){
	if (i != 0){
	    ret += " + ";
	}
	var midterm = midterms[i];
	for (var j in midterm.inputs){
	    if (midterm.inputs[j] != '-'){
		ret += printVar(j, midterm.inputs[j], useXs);
	    }
	}
    }
    return ret;
}

function solve(outputs){
    if (Math.pow(2, Math.ceil(Math.log(outputs.length) / Math.log(2))) != outputs.length){
	throw ("Неправильное количество выходов: " + outputs.length);
    }
    var nVars = Math.log(outputs.length) / Math.log(2);
    var midterms = new Array();
    for (var i in outputs){
	if (outputs[i] == 1){
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
    console.log(serialize(midterms));
    return midterms;
    //document.write(serialize(midterms));
}

function output(text){
    document.getElementById("output").innerText += text + "\n";
}

function main(){
    try{
	var text = document.getElementById("inputs").value.replace(/[^01]/g, "");
	var outputs = new Array();
	for (var i in text){
	    outputs.push({'0': 0, '1': 1}[text[i]]);
	}
	solution = solve(outputs);
	output("Выходы: [" + outputs.join(" ") + "], решение: " + serialize(solution) + " (или " + serialize(solution, true) + ")");
    } catch (err){
	output(err);
    }
}
//console.log(getInputs(13, 4));
//console.log(solve([0, 0, 0, 0, 1, 0, 0, 0, 1, 1, 1, 1, 1, 0, 1, 1]))
//console.log(solve([0, 1, 0, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0]))
