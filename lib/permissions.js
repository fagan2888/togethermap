// get the google is from a user object
googleId = function (u) {
    if( !u ||
        !u.services ||
        !u.services.google)
        return null;
    return 'google:'+u.services.google.id;
};


// this or's the meteor userid with the google id since historically
// things were owned by the google id - this allows users to get their
// data back from the old version of the site.

userIdExpression = function (user) {
    var users = [user._id];
    var g = googleId(user);
    if(g)
        users.push(g);

    return {creatorUID: {$in: users}};
};


var admins = ['ceTir2NKMN87Gq7wj'];

isAdmin = function (userId) {
    return _.indexOf(admins, userId) != -1
};


isMine = function (o, user) {
    return o.creatorUID && (o.creatorUID == user._id ||
        o.creatorUID == googleId(user));
};


isReadPublic = function (o) {
    return o.read_private != true;
};


isWritePublic = function (o) {
    return o.write_private != true;
};


isInReaders = function (p, userId) {
    return p && _.indexOf(p.readers, userId) != -1;
};


isInWriters = function (p, userId, type) {

    if(!p) {
        return false;
    }

    if(type == "collection") {
        // have to be in owner's list or admin to edit collections
        return false;
    }

    var post_writer = _.indexOf(p.post_writers, userId) != -1
    var place_writer = _.indexOf(p.place_writers, userId) != -1

    if(type == "post") {
        return post_writer;
    } else if(type == "place") {
        return place_writer;
    } else {
        // this is actually user to check if ok for reading
        return post_writer || place_writer;
    }
};


isInOwners = function (p, userId) {
    return p && _.indexOf(p.owners, userId) != -1;
};


readPermission = function (user, cid) {

    // be safe, have to specify a collection
    if(!cid)
        return false;

    var c = MCollections.findOne(cid);

    if(!c) {
        // server already rejected this
        return false;
    }

    if(!user) {
        return isReadPublic(c);
    }

    var p = MPermissions.findOne(cid);
    var userId = user._id;

    if(!c)
        return false;

    return isAdmin(userId) ||
        isMine(c, user) ||
        isReadPublic(c) ||
        isInReaders(p, userId) ||
        isInWriters(p, userId) ||
        isInOwners(p, userId);
};


writePermission = function(obj, cid, user, type) {

    if(!user)
        return false;

    var c = MCollections.findOne(cid);

    if(!c) {
        // because server rejected the read?
        return false;
    }

    var p = MPermissions.findOne(cid);
    var userId = user._id;

    // two cases either we're creating or updating

    // if admin or owner of collection, always ok
    if(isAdmin(userId) ||
        isMine(c, user) ||
        isInOwners(p, userId))
        return true;

    if(!obj) {
        // if !obj means we're creating a new object, has to be
        // write public or in writers for this type
        return isWritePublic(c) || isInWriters(p, userId, type);
    }

    // otherwise update, has to be your object (presumably if
    // it's your object you DON'T still have to be in the writers
    // list, at least according to this logic - can be changed
    return isMine(obj, user);
};