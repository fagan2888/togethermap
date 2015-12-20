Template.quick_place.helpers({
    dynamic_place: function () {
        if(templates.place_template_list) {
            return templates.place_template_list(this);
        } else {
            return Handlebars.compile(defaultPlaceTemplateList)(this);
        }
    }
});

Template.quick_place.events = {

    'click .pan-map': function () {

        Map.goToPlace(this);
    },

    'click .go-to-place': function (e) {

        e.preventDefault();
        Router.go('place', {
            _id: this._id,
            _cid: this.collectionId
        });
    },
};