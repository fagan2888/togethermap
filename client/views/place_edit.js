var jqueryInit = function (id) {
    var place = MPlaces.findOne(Session.get('active_place'));
    initFroala(function (html) {
        Meteor.call('updatePlace', id, {$set:{'properties.description': html}});
    });
    $('#shape-color').val(place.properties.color);
    $('#shape-color').pickAColor({
        showAdvanced: false,
        showHexInput: false,
        allowBlank: false
    });
};


Template.placeEdit.rendered = function () {
    jqueryInit(this.data.place._id);
};


Template.placeEdit.helpers({
    isMarker: function () {
        return this.geometry.type == "Point";
    },
    isLine: function () {
        return this.geometry.type == "LineString";
    },
    icons: function () {
        var d = _.map(L.MakiMarkers.icons,
            function (v) { return {name: v} });
        d.unshift({name: ''});
        return d;
    },
    iconSelected: function() {
        return this.name === Template.parentData(1).properties.icon
            ? 'selected' : '';
    },
    icon_sizes: function () {
        return _.map(['s', 'm', 'l'],
            function (v) { return {name: v} });
    },
    sizeSelected: function() {
        return this.name === (Template.parentData(1).properties.icon_size || 'm')
            ? 'selected' : '';
    },
    line_widths: function () {
        return _.map([3, 6, 9, 12],
            function (v) { return {name: v} });
    },
    widthSelected: function() {
        return this.name === (Template.parentData(1).properties.weight || 9)
            ? 'selected' : '';
    }
});


Template.placeEdit.events({

    'change input[name=name]': function(event) {
        Meteor.call('updatePlace', this._id, {$set:{'properties.name': event.target.value}});
    },

    "change #shape-color": function (evt) {

        var v = $(evt.target).val();
        Meteor.call('updatePlace', this._id, {$set: {'properties.color': v}});

    },

    "change #icons": function (evt) {

        var v = $(evt.target).val();
        Meteor.call('updatePlace', this._id, {$set: {'properties.icon': v}});

    },

    "change #icon_size": function (evt) {

        var v = $(evt.target).val();
        Meteor.call('updatePlace', this._id, {$set: {'properties.icon_size': v}});

    },

    "change #line_width": function (evt) {

        var v = $(evt.target).val();
        Meteor.call('updatePlace', this._id, {$set: {'properties.weight': v}});

    },

    'click .delete-link': function(e) {

        e.preventDefault();
        var that = this;
        bootbox.confirm("Are you sure you want to delete this PLACE?", function(result) {
            if(result) {
                Meteor.call('removePlace', that._id, that.collectionId);
                Router.go('collection', {
                    _id: Session.get('active_collection')
                });
            }
        });
    },

    'click .cancel': function(e) {

        e.preventDefault();
        Router.go('place', {
            _cid: Session.get('active_collection'),
            _id: this._id
        });
    }
});