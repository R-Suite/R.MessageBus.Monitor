//Copyright (C) 2015  Timothy Watson, Jakub Pachansky

//This program is free software; you can redistribute it and/or
//modify it under the terms of the GNU General Public License
//as published by the Free Software Foundation; either version 2
//of the License, or (at your option) any later version.

//This program is distributed in the hope that it will be useful,
//but WITHOUT ANY WARRANTY; without even the implied warranty of
//MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//GNU General Public License for more details.

//You should have received a copy of the GNU General Public License
//along with this program; if not, write to the Free Software
//Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.

define(['backbone'], function (Backbone) {

    "use strict";

    var model = Backbone.Model.extend({

        url: "settings",

        initialize: function() {
            _.bindAll(this);
            if (!(this.attributes.Environments instanceof Backbone.Collection)) {
                this.attributes.Environments = new Backbone.Collection(this.attributes.Environments);
            }
        },

        parse: function(data) {
            if (data) {
                data.Environments = new Backbone.Collection(data.Environments);
            }
            return data;
        },

        toJSON: function() {
            var attributes = _.clone(this.attributes);
            $.each(attributes, function(key, value) {
                if (value !== null && value !== undefined && _(value.toJSON).isFunction()) {
                    attributes[key] = value.toJSON();
                }
            });
            return attributes;
        }
    });

    return model;
});
