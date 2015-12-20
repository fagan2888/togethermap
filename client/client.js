Meteor.startup(function(){
});


var formatDate = function (date, format) {
    if(!date)
        return 'no date';
    return moment(date).format(format || 'MMM Do YYYY, h:mm a');
};

var formatNumber = function (num, format) {
    return numeral(num || 0).format(format || '0,0');
};

Template.registerHelper('formatDate', function(date) {
    return formatDate(date);
});

Handlebars.registerHelper('formatDate', function(date, options) {
    return formatDate(date, options.hash.format);
});


Template.registerHelper('formatNumber', function(num) {
    return formatNumber(num);
});

Handlebars.registerHelper('formatNumber', function(num, options) {
    return formatNumber(num, options.hash.format);
});


Template.registerHelper('json', function(json) {
    return JSON.stringify(json, undefined, 2);
});

Handlebars.registerHelper('json', function(json) {
    return JSON.stringify(json, undefined, 2);
});

Handlebars.registerHelper('defaultValue', function(v, def) {
    return  v || def;
});

Template.registerHelper('pluralize', function(n, thing) {
    n = n || 0;
    // fairly stupid pluralizer
    if (n === 1) {
        return '1 ' + thing;
    } else {
        return n + ' ' + thing + 's';
    }
});


syntaxHighlight = function (json) {
    if (typeof json != 'string') {
        json = JSON.stringify(json, undefined, 2);
    }
    json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
        var cls = 'number';
        if (/^"/.test(match)) {
            if (/:$/.test(match)) {
                cls = 'key';
            } else {
                cls = 'string';
            }
        } else if (/true|false/.test(match)) {
            cls = 'boolean';
        } else if (/null/.test(match)) {
            cls = 'null';
        }
        return '<span class="' + cls + '">' + match + '</span>';
    });
};


function strip(html)
{
    var tmp = document.createElement("DIV");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
}

Template.registerHelper('stripContent', function(content){
    return strip(content);
});