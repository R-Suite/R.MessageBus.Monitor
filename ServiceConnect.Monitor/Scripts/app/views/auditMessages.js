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

define(['backbone',
    'underscore',
    'jquery',
    'bower_components/requirejs-text/text!app/templates/auditMessages.html',
    "app/collections/auditMessages",
    "app/views/auditTable",
    "app/views/auditHistogram",
    "app/helpers/timer"
], function(Backbone, _, $, template, AuditMessagesCollection, AuditTableView, AuditHistogramView, Timer) {

    "use strict";

    var view = Backbone.View.extend({

        el: ".mainContent",

        events: {
            "change .from": "_fetchAudits",
            "change .to": "_fetchAudits",
            "change .timeRange": "_setRange"
        },

        initialize: function() {
            _.bindAll(this);
            this.tags = [];
            this.from = moment.utc().subtract(15, "minutes").format();
            this.to = moment.utc().format();
            this.timer = new Timer(this._updateCollection, 2000);
        },

        render: function() {
            this.$el.html(template);

            this.$el.find(".dateRange").hide();

            this.$el.find('.date').datetimepicker({
                autoclose: true,
                format: "DD/MM/YYYY HH:mm:ss"
            });

            this.$el.find('.from').val(moment.utc(this.from).format("DD/MM/YYYY HH:mm:ss"));
            this.$el.find('.to').val(moment.utc(this.to).format("DD/MM/YYYY HH:mm:ss"));

            this.collection = new AuditMessagesCollection();

            this.collection.from = this.from;
            this.collection.to = this.to;
            this.collection.fetch({
                success: this._renderViews,
                data: {
                    from: this.from,
                    to: this.to,
                    tags: this.tags
                }
            });

            var that = this;
            this.$el.find(".tags").select2({
                multiple: true,
                allowClear: true,
                query: function(query) {
                    $.ajax({
                        url: "/tags",
                        data: {
                            query: query.term
                        },
                        success: function(data) {
                            var results = [];
                            for (var i = 0; i < data.length; i++) {
                                results.push({
                                    id: data[i],
                                    text: data[i]
                                });
                            }
                            query.callback({
                                results: results
                            });
                        }
                    });
                }
            }).on("select2-selecting", function(e, d) {
                that.tags.push(e.object.id);
                that._filterAuditMessages();
            }).on("select2-removed", function(e, d) {
                var index;
                $.each(that.tags, function(i, tag) {
                    if (tag === e.val) {
                        index = i;
                    }
                });
                that.tags.splice(index, 1);
                that._filterAuditMessages();
            });

            return this;
        },

        _filterAuditMessages: function() {
            var that = this;
            this.collection.from = this.from;
            this.collection.to = this.to;
            this.collection.fetch({
                data: {
                    from: this.from,
                    to: this.to,
                    tags: this.tags.join()
                },
                reset: true,
                success: function() {
                    that.auditTableView.refresh();
                    that.auditHistogramView.refresh();
                }
            });
        },

        _renderViews: function() {
            this.auditHistogramView = new AuditHistogramView({
                collection: this.collection
            });
            this.$el.find(".auditHistogram").html(this.auditHistogramView.$el);
            this.renderView(this.auditHistogramView);
            this.auditTableView = new AuditTableView({
                collection: this.collection.fullCollection
            });
            this.$el.find(".auditTable").html(this.auditTableView.$el);
            this.renderView(this.auditTableView);

            Backbone.Hubs.AuditHub.on("audits", this._addAudits);
            this.timer.start();
        },

        _setRange: function() {
            Backbone.Hubs.AuditHub.off("audits", this._addAudits);
            this.$el.find(".dateRange").hide();

            var from = this._getFromTime();
            var to = moment.utc();
            this.from = from.format();
            this.to = to.format();

            var range = this.$el.find(".timeRange").val();
            if (range !== "Custom Range") {
                Backbone.Hubs.AuditHub.on("audits", this._addAudits);
            } else {
                this.$el.find(".dateRange").show();
            }

            this.$el.find('.from').val(from.format("DD/MM/YYYY HH:mm:ss"));
            this.$el.find('.to').val(to.format("DD/MM/YYYY HH:mm:ss"));

            var that = this;
            this.collection.from = this.from;
            this.collection.to = this.to;
            this.collection.fetch({
                data: {
                    from: this.from,
                    to: this.to,
                    tags: this.tags.join()
                },
                reset: true,
                success: function() {
                    that.auditHistogramView.refresh();
                    that.auditTableView.refresh();
                }
            });
        },

        _fetchAudits: function() {
            Backbone.Hubs.AuditHub.off("audits", this._addAudits);

            var from = moment.utc(this.$el.find('.from').val(), "DD/MM/YYYY HH:mm:ss");
            var to = moment.utc(this.$el.find('.to').val(), "DD/MM/YYYY HH:mm:ss");
            this.from = from.format();
            this.to = to.format();

            var that = this;
            this.collection.from = this.from;
            this.collection.to = this.to;
            this.collection.fetch({
                data: {
                    from: this.from,
                    to: this.to,
                    tags: this.tags.join()
                },
                reset: true,
                success: function() {
                    that.auditHistogramView.refresh();
                    that.auditTableView.refresh();
                }
            });
        },

        _addAudits: function(audits) {
            var from = this._getFromTime();
            var to = moment.utc();
            this.from = from.format();
            this.to = to.format();
            this.collection.from = this.from;
            this.collection.to = this.to;
            for (var i = 0; i < audits.length; i++) {
                this.collection.fullCollection.add(new Backbone.Model(audits[i]), {
                    at: 0
                });
            }
            this.auditTableView.addAudits(audits);
            this.auditHistogramView.refresh();
        },

        _updateCollection: function() {
            var from = this._getFromTime();
            var to = moment.utc();
            this.from = from.format();
            this.to = to.format();
            this.collection.from = this.from;
            this.collection.to = this.to;
            this.auditTableView.removeMessages(from);
            for (var i = this.collection.fullCollection.length - 1; i >= 0; i--) {
                var model = this.collection.fullCollection.at(i);
                if (moment.utc(model.get("TimeSent")) < from) {
                    this.collection.fullCollection.remove(model);
                } else {
                    break;
                }
            }
            this.auditHistogramView.refresh();
        },

        _getFromTime: function() {
            var from;
            var range = this.$el.find(".timeRange").val();
            switch (range) {
                case "Last 5m":
                    from = moment.utc().subtract(5, "minutes");
                    break;
                case "Last 15m":
                    from = moment.utc().subtract(15, "minutes");
                    break;
                case "Last 30m":
                    from = moment.utc().subtract(30, "minutes");
                    break;
                case "Last 1h":
                    from = moment.utc().subtract(60, "minutes");
                    break;
                case "Last 2h":
                    from = moment.utc().subtract(120, "minutes");
                    break;
                case "Last 4h":
                    from = moment.utc().subtract(240, "minutes");
                    break;
                case "Last 6h":
                    from = moment.utc().subtract(360, "minutes");
                    break;
                case "Last 12h":
                    from = moment.utc().subtract(720, "minutes");
                    break;
                case "Last 24h":
                    from = moment.utc().subtract(1440, "minutes");
                    break;
                case "Last 2d":
                    from = moment.utc().subtract(2880, "minutes");
                    break;
                case "Last 7d":
                    from = moment.utc().subtract(10080, "minutes");
                    break;
                case "Last 14d":
                    from = moment.utc().subtract(20160, "minutes");
                    break;
                case "Last 30d":
                    from = moment.utc().subtract(43200, "minutes");
                    break;
                case "Custom Range":
                    from = moment.utc(this.$el.find(".from").val(), "DD/MM/YYYY HH:mm:ss");
                    break;
                default:
                    from = moment.utc().subtract(5, "minutes");
            }
            return from;
        },

        onClose: function() {
            Backbone.Hubs.AuditHub.off("audits", this._addAudits);
            this.timer.stop();
        }
    });

    return view;
});
