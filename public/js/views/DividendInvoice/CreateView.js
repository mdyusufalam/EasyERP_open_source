define([
        'jQuery',
        'Underscore',
        'Backbone',
        "text!templates/DividendInvoice/CreateTemplate.html",
        'views/Notes/AttachView',
        "models/InvoiceModel",
        "common",
        "populate",
        "views/DividendInvoice/InvoiceProductItems",
        "views/Assignees/AssigneesView",
        "views/Payment/list/ListHeaderInvoice",
        "dataService",
        'constants'
    ],
    function ($, _, Backbone, CreateTemplate, attachView, InvoiceModel, common, populate, InvoiceItemView, AssigneesView, listHederInvoice, dataService, CONSTANTS) {

        var CreateView = Backbone.View.extend({
            el         : "#content-holder",
            contentType: "Invoice",
            template   : _.template(CreateTemplate),

            initialize: function (options) {
                _.bindAll(this, "saveItem", "render");
                this.model = new InvoiceModel();
                this.responseObj = {};
                this.render();
            },

            events       : {
                'keydown'                                                         : 'keydownHandler',
                'click .dialog-tabs a'                                            : 'changeTab',
                "click .details"                                                  : "showDetailsBox",
                "click .current-selected"                                         : "showNewSelect",
                "click"                                                           : "hideNewSelect",
                "click .newSelectList li:not(.miniStylePagination)"               : "chooseOption",
                "click .newSelectList li.miniStylePagination"                     : "notHide",
                "click .newSelectList li.miniStylePagination .next:not(.disabled)": "nextSelect",
                "click .newSelectList li.miniStylePagination .prev:not(.disabled)": "prevSelect"
            },

            showNewSelect: function (e, prev, next) {
                populate.showSelect(e, prev, next, this);
                return false;

            },

            notHide      : function () {
                return false;
            },

            hideNewSelect: function () {
                $(".newSelectList").hide();
            },

            chooseOption : function (e) {
                var holder = $(e.target).parents("dd").find(".current-selected");
                holder.text($(e.target).text()).attr("data-id", $(e.target).attr("id"));
                $(e.target).closest('td').removeClass('errorContent');
            },

            nextSelect    : function (e) {
                this.showNewSelect(e, false, true);
            },

            prevSelect    : function (e) {
                this.showNewSelect(e, true, false);
            },

            showDetailsBox: function (e) {
                $(e.target).parent().find(".details-box").toggle();
            },

            keydownHandler: function (e) {
                switch (e.which) {
                    case 27:
                        this.hideDialog();
                        break;
                    default:
                        break;
                }
            },

            changeTab: function (e) {
                var holder = $(e.target);
                var n;
                var dialog_holder;
                var closestEl = holder.closest('.dialog-tabs');
                var dataClass = closestEl.data('class');
                var selector = '.dialog-tabs-items.' + dataClass;
                var itemActiveSelector = '.dialog-tabs-item.' + dataClass + '.active';
                var itemSelector = '.dialog-tabs-item.' + dataClass;

                closestEl.find("a.active").removeClass("active");
                holder.addClass("active");

                n = holder.parents(".dialog-tabs").find("li").index(holder.parent());
                dialog_holder = $(selector);

                dialog_holder.find(itemActiveSelector).removeClass("active");
                dialog_holder.find(itemSelector).eq(n).addClass("active");
            },

            saveItem: function () {
                var self = this;
                var mid = 100;
                var $currentEl = this.$el;
                var errors = $currentEl.find('.errorContent');
                var selectedProducts = $currentEl.find('.productItem');
                var products = [];
                var selectedLength = selectedProducts.length;
                var targetEl;
                var productId;
                var quantity;
                var price;
                var taxes;
                var whoCanRW;
                var data;
                var model;
                var amount;
                var groupsId;
                var usersId;
                var description;

                var invoiceDate = $currentEl.find("#invoice_date").val();
                var dueDate = $currentEl.find("#due_date").val();

                var total = 100 * parseFloat($currentEl.find("#totalAmount").text());
                var unTaxed = 100 * parseFloat($currentEl.find("#totalUntaxes").text());
                var balance = 100 * parseFloat($currentEl.find("#balance").text());

                var payments = {
                    total  : total,
                    unTaxed: unTaxed,
                    balance: balance
                };

                var currency = {
                    _id : $currentEl.find('#currencyDd').attr('data-id'),
                    name: $.trim($currentEl.find('#currencyDd').text())
                };

                if (errors.length) {
                    return false;
                }

                if (selectedLength) {
                    for (var i = selectedLength - 1; i >= 0; i--) {
                        targetEl = $(selectedProducts[i]);
                        productId = targetEl.data('id');
                        if (productId) {
                            price = 100 * parseFloat(targetEl.find('[data-name="price"] input').val());
                            description = targetEl.find('[data-name="productDescr"] input').val();
                            taxes = targetEl.find('.taxes').text();
                            amount = 100 * targetEl.find('.amount').text();

                            if (!price) {
                                return App.render({
                                    type: 'error',
                                    message: 'Fields "price" and "quantity" can\'t be empty or 0'
                                });
                            }

                            products.push({
                                product    : productId,
                                description: description,
                                unitPrice  : price,
                                taxes      : taxes,
                                subTotal   : amount
                            });
                        }
                    }
                }

                usersId = [];
                groupsId = [];
                $(".groupsAndUser tr").each(function () {
                    if ($(this).data("type") == "targetUsers") {
                        usersId.push($(this).data("id"));
                    }
                    if ($(this).data("type") == "targetGroups") {
                        groupsId.push($(this).data("id"));
                    }

                });

                whoCanRW = this.$el.find("[name='whoCanRW']:checked").val();
                data = {
                    forSales: false,
                    invoiceDate          : invoiceDate,
                    dueDate              : dueDate,
                    journal              : null,
                    products   : products,
                    paymentInfo: payments,
                    currency   : currency,
                    groups  : {
                        owner: $("#allUsersSelect").data("id"),
                        users: usersId,
                        group: groupsId
                    },
                    whoCanRW: whoCanRW,
                    workflow: this.defaultWorkflow
                };

                model = new InvoiceModel();
                model.urlRoot = function () {
                    return 'DividendInvoice';
                };

                model.save(data, {
                    patch  : true,
                    headers: {
                        mid: mid
                    },
                    wait   : true,
                    success: function () {
                        self.hideDialog();
                        Backbone.history.navigate('#easyErp/DividendInvoice', {trigger: true});
                    },
                    error  : function (model, xhr) {
                        self.errorNotification(xhr);
                    }
                });
            },

            hideDialog: function () {
                $(".edit-dialog").remove();
                $(".add-group-dialog").remove();
                $(".add-user-dialog").remove();
                $(".crop-images-dialog").remove();
            },

            render: function () {
                var formString = this.template();
                var self = this;
                var invoiceItemContainer;
                var paymentContainer;
                var notDiv;
                var today = new Date();

                this.$el = $(formString).dialog({
                    closeOnEscape: false,
                    autoOpen     : true,
                    resizable    : true,
                    dialogClass  : "edit-dialog",
                    title        : "Create Invoice",
                    width        : "900px",
                    position     : {within: $("#wrapper")},
                    buttons      : [
                        {
                            id   : "create-invoice-dialog",
                            text : "Create",
                            click: function () {
                                self.saveItem();
                            }
                        },

                        {
                            text : "Cancel",
                            click: function () {
                                self.hideDialog();
                            }
                        }]

                });

                notDiv = this.$el.find('.assignees-container');
                notDiv.append(
                    new AssigneesView({
                        model: this.currentModel
                    }).render().el
                );

                invoiceItemContainer = this.$el.find('#invoiceItemsHolder');
                invoiceItemContainer.append(
                    new InvoiceItemView({balanceVisible: true, canBeSold: this.forSales, paid: 0}).render().el
                );

                paymentContainer = this.$el.find('#payments-container');
                paymentContainer.append(
                    new listHederInvoice().render().el
                );

                populate.get("#currencyDd", "/currency/getForDd", {}, 'name', this, true);
                populate.get2name("#employeesDd", "/getPersonsForDd", {}, this, true, false);
                populate.get("#payment_terms", "/paymentTerm", {}, 'name', this, true, true);
                populate.get2name("#salesPerson", CONSTANTS.EMPLOYEES_RELATEDUSER, {}, this, true, true);
                populate.fetchWorkflow({wId: 'Purchase Invoice'}, function (response) {
                    if (!response.error) {
                        self.defaultWorkflow = response._id;
                    }
                });

                this.$el.find('#invoice_date').datepicker({
                    dateFormat : "d M, yy",
                    changeMonth: true,
                    changeYear : true
                }).datepicker('setDate', today);

                today.setDate(today.getDate() + 14);

                this.$el.find('#due_date').datepicker({
                    dateFormat : "d M, yy",
                    changeMonth: true,
                    changeYear : true,
                    onSelect    : function () {
                        var targetInput = $(this);
                        targetInput.removeClass('errorContent');
                    }
                }).datepicker('setDate', today);

                this.delegateEvents(this.events);

                return this;
            }

        });

        return CreateView;
    });
