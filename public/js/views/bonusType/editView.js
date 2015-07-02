/**
 * Created by Liliya_Pikiner on 7/1/2015.
 */
define([
        "common",
        "custom",
        "dataService",
        "populate",
        'constants'
    ], function (common, Custom, dataService, populate, CONSTANTS) {

        var EditView = Backbone.View.extend({
            contentType: CONSTANTS.BONUSTYPE,

            initialize: function (options) {
                if (options) {
                    this.visible = options.visible;
                }

                _.bindAll(this, "render", "saveItem");
                _.bindAll(this, "render", "deleteItem");

                this.currentModel = (options.model) ? options.model : options.collection.getElement();
                this.currentModel.urlRoot = "/bonusType";
                this.responseObj = {};
                this.render(options);
            },

            events: {
                'keydown': 'keyDown',
                'click .dialog-tabs a': 'changeTab',
                "click .current-selected": "showNewSelect",
                "click": "hideNewSelect",
                "click .newSelectList li:not(.miniStylePagination)": "chooseOption",
                "click .newSelectList li.miniStylePagination": "notHide",
                "click .newSelectList li.miniStylePagination .next:not(.disabled)": "nextSelect"
            },

            saveItem: function () {
                var self = this;
                var mid = 72;
                var thisEl = this.$el;
                var name = thisEl.find('#name').val();
                var value =  thisEl.find('#value').val();
                var department =  thisEl.find('#department').val();
                var isPercent = thisEl.find('#isPercent').val();

                this.model.save({
                    name: name,
                    value: value,
                    department: department,
                    isPercent: isPercent
                }, {
                    headers: {
                        mid: mid
                    },
                    wait: true,
                    success: function () {
                        self.hideDialog();
                        Backbone.history.navigate("easyErp/bonusType/list", {trigger: true});
                    },
                    error: function (model, xhr) {
                        self.errorNotification(xhr);
                    }

                });
            },

            nextSelect: function (e) {
                this.showNewSelect(e, false, true);
            },

            notHide: function () {
                return false;
            },

            chooseOption: function (e) {
                $(e.target).parents("dd").find(".current-selected").text($(e.target).text()).attr("data-id", $(e.target).attr("id"));
            },

            hideNewSelect: function () {
                $(".newSelectList").hide();
            },

            showNewSelect: function (e, prev, next) {
                populate.showSelect(e, prev, next, this);

                return false;
            },

            changeTab: function (e) {
                var holder = $(e.target);
                var dialog_holder;
                var closestEl = holder.closest('.dialog-tabs');
                var dataClass = closestEl.data('class');
                var selector = '.dialog-tabs-items.' + dataClass;
                var itemActiveSelector = '.dialog-tabs-item.' + dataClass + '.active';
                var itemSelector = '.dialog-tabs-item.' + dataClass;
                var n;

                closestEl.find("a.active").removeClass("active");
                holder.addClass("active");

                n = holder.parents(".dialog-tabs").find("li").index(holder.parent());
                dialog_holder = $(selector);

                dialog_holder.find(itemActiveSelector).removeClass("active");
                dialog_holder.find(itemSelector).eq(n).addClass("active");
            },


            keyDown: function (e) {
                switch (e.which) {
                    case 27:
                        this.hideDialog();
                        break;
                    default:
                        break;
                }
            },

            deleteItem: function(event) {
                var mid = 72;
                var self = this;

                event.preventDefault();

                this.currentModel.destroy({
                    headers: {
                        mid: mid
                    },
                    success: function () {
                        $('.edit-product-dialog').remove();
                        Backbone.history.navigate("easyErp/" + self.contentType + '/list', {trigger: true});
                    },
                    error: function (model, xhr) {
                        self.errorNotification(xhr);
                    }
                });
            },

            render: function () {
                var formString = this.template({
                    model: this.currentModel.toJSON(),
                    visible: this.visible
                });

                this.$el = $(formString).dialog({
                    closeOnEscape: false,
                    autoOpen: true,
                    resizable: true,
                    dialogClass: "edit-dialog",
                    title: "Edit bonusType",
                    width: "900px",
                    buttons: [
                        {
                            text: "Save",
                            click: function () {
                                self.saveItem();
                            }
                        },
                        {
                            text: "Cancel",
                            click: function () {
                                self.hideDialog();
                            }
                        },
                        {
                            text: "Delete",
                            click: self.deleteItem
                        }
                    ]

                });

                this.delegateEvents(this.events);
                model = this.currentModel.toJSON();

                return this;
            },

            hideDialog: function () {
                $(".edit-dialog").remove();
                $(".add-group-dialog").remove();
                $(".add-user-dialog").remove();
            }

        });

        return EditView;
    });