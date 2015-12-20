Template.recent.helpers({
    noPosts: function () {
        return this.recent_posts.fetch().length == 0;
    },
    noComments: function () {
        return this.recent_comments.fetch().length == 0;
    }
});


Template.recent.events = {

    'click .collection-go': function (e) {

        e.preventDefault();
        var cid = Session.get('active_collection');
        Router.go('collection', {
            _id: cid
        });
    },

    'click .place-go': function (e) {

        e.preventDefault();
        var cid = Session.get('active_collection');
        Router.go('place', {
            _id: this._id,
            _cid: cid
        });
    },

    'click .post-go': function (e) {

        e.preventDefault();
        var cid = Session.get('active_collection');
        Router.go('place', {
            _id: this.placeId,
            _cid: cid
        });
        /*Router.go('post', {
            _id: this._id,
            _cid: cid
        });*/
    },

    'click .comment-go': function (e) {

        e.preventDefault();
        var cid = Session.get('active_collection');
        Router.go('post', {
            _id: this.postId,
            _cid: cid
        });
    }
};