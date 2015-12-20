Template.image.events({

    'click .lightbox-img': function (e) {

        e.preventDefault();
        var size = e.altKey ? 'large' : null;
        var src = $(e.target).attr('src');
        var t = '<div><img src="' + src + '" style="width: 100%"></div>';
        makeBootbox(t, size);
    },

    'click .link-img': function (e) {

        e.preventDefault();

        if(this.collectionId && this.placeId) {
	        Router.go('place', {
	            _id: this.placeId,
	            _cid: this.collectionId
	        });
		}
    },
});