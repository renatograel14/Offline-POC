'use strict';

app.home = kendo.observable({
    onShow: function() {},
    afterShow: function() {}
});

// START_CUSTOM_CODE_home
// Add custom code here. For more information about custom code, see http://docs.telerik.com/platform/screenbuilder/troubleshooting/how-to-keep-custom-code-changes

// END_CUSTOM_CODE_home


// START_CUSTOM_CODE_homeModel
// Add custom code here. For more information about custom code, see http://docs.telerik.com/platform/screenbuilder/troubleshooting/how-to-keep-custom-code-changes
(function(parent) {
    var dataProvider = app.data.jsonDataProvider,
        fetchFilteredData = function(paramFilter, searchFilter) {
            var model = parent.get('homeModel'),
                dataSource = model.get('dataSource');

            if (paramFilter) {
                model.set('paramFilter', paramFilter);
            } else {
                model.set('paramFilter', undefined);
            }

            if (paramFilter && searchFilter) {
                dataSource.filter({
                    logic: 'and',
                    filters: [paramFilter, searchFilter]
                });
            } else if (paramFilter || searchFilter) {
                dataSource.filter(paramFilter || searchFilter);
            } else {
                dataSource.filter({});
            }
        },
        processImage = function(img) {

            if (!img) {
                var empty1x1png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVQI12NgYAAAAAMAASDVlMcAAAAASUVORK5CYII=';
                img = 'data:image/png;base64,' + empty1x1png;
            }

            return img;
        },
        dataSourceOptions = {
            offlineStorage: "offline-kendo-demo",
            transport: {
                read:  {
                    url: "https://demos.telerik.com/kendo-ui/service/products",
                    dataType: "jsonp"
                },
                update: {
                    url: "https://demos.telerik.com/kendo-ui/service/products/update",
                    dataType: "jsonp"
                },
                destroy: {
                    url: "https://demos.telerik.com/kendo-ui/service/products/destroy",
                    dataType: "jsonp"
                },
                create: {
                    url: "https://demos.telerik.com/kendo-ui/service/products/create",
                    dataType: "jsonp"
                },
                parameterMap: function(options, operation) {
                    if (operation !== "read" && options.models) {
                        return {models: kendo.stringify(options.models)};
                    }
                }
            },
            requestStart: function(e) {
                if (e.type != "read") {
                    console.log(kendo.format("Request start ({0})", e.type));
                }
            },
            requestEnd: function(e) {
                if (e.type != "read") {
                    console.log(kendo.format("Request end ({0})", e.type));
                }
            },
            batch: true,
            pageSize: 20,
            schema: {
                model: {
                    id: "ProductID",
                    fields: {
                        ProductID: { editable: false, nullable: true },
                        ProductName: {  nullable: true },
                     }
                }
            }
        },
        dataSource = new kendo.data.DataSource(dataSourceOptions),
        homeModel = kendo.observable({
            dataSource: dataSource,
            fixHierarchicalData: function(data) {
                var result = {},
                    layout = {};

                $.extend(true, result, data);

                (function removeNulls(obj) {
                    var i, name,
                        names = Object.getOwnPropertyNames(obj);

                    for (i = 0; i < names.length; i++) {
                        name = names[i];

                        if (obj[name] === null) {
                            delete obj[name];
                        } else if ($.type(obj[name]) === 'object') {
                            removeNulls(obj[name]);
                        }
                    }
                })(result);

                (function fix(source, layout) {
                    var i, j, name, srcObj, ltObj, type,
                        names = Object.getOwnPropertyNames(layout);

                    for (i = 0; i < names.length; i++) {
                        name = names[i];
                        srcObj = source[name];
                        ltObj = layout[name];
                        type = $.type(srcObj);

                        if (type === 'undefined' || type === 'null') {
                            source[name] = ltObj;
                        } else {
                            if (srcObj.length > 0) {
                                for (j = 0; j < srcObj.length; j++) {
                                    fix(srcObj[j], ltObj[0]);
                                }
                            } else {
                                fix(srcObj, ltObj);
                            }
                        }
                    }
                })(result, layout);

                return result;
            },
            itemClick: function(e) {
                var dataItem = e.dataItem || homeModel.originalItem;

                app.mobileApp.navigate('#components/home/details.html?uid=' + dataItem.uid);

            },
            detailsShow: function(e) {
                homeModel.setCurrentItemByUid(e.view.params.uid);
            },
            addClick: function() {
                app.mobileApp.navigate('#components/home/add.html');
            },
            setCurrentItemByUid: function(uid) {
                var item = uid,
                    dataSource = homeModel.get('dataSource'),
                    itemModel = dataSource.getByUid(item);

                if (!itemModel.ProductName) {
                    itemModel.ProductName = String.fromCharCode(160);
                }

                homeModel.set('originalItem', itemModel);
                homeModel.set('currentItem',
                    homeModel.fixHierarchicalData(itemModel));

                return itemModel;
            },
            linkBind: function(linkString) {
                var linkChunks = linkString.split('|');
                if (linkChunks[0].length === 0) {
                    return this.get("currentItem." + linkChunks[1]);
                }
                return linkChunks[0] + this.get("currentItem." + linkChunks[1]);
            },
            imageBind: function(imageField) {
                if (imageField.indexOf("|") > -1) {
                    return processImage(this.get("currentItem." + imageField.split("|")[0]));
                }
                return processImage(imageField);
            },
            currentItem: {}
        });

    if (typeof dataProvider.sbProviderReady === 'function') {
        dataProvider.sbProviderReady(function dl_sbProviderReady() {
            parent.set('homeModel', homeModel);
        });
    } else {
        parent.set('homeModel', homeModel);
    }

    parent.set('addItemViewModel', kendo.observable({
        onShow: function(e) {
            // Reset the form data.
            this.set('addFormData', {
                productName: '',
            });
        },
        onSaveClick: function(e) {
            var addFormData = this.get('addFormData'),
            addModel = {
                ProductName: addFormData.productName,
            },
            filter = homeModel && homeModel.get('paramFilter'),
            dataSource = homeModel.get('dataSource');

            dataSource.insert(addModel);
            dataSource.one('change', function(e) {
                app.mobileApp.navigate('#:back');
            });
            dataSource.sync();
        }
    }));
    parent.set('onShow', function(e) {
        var param = e.view.params.filter ? JSON.parse(e.view.params.filter) : null,
            isListmenu = false,
            backbutton = e.view.element && e.view.element.find('header [data-role="navbar"] .backButtonWrapper');

        if (param || isListmenu) {
            backbutton.show();
            backbutton.css('visibility', 'visible');
        } else {
            if (e.view.element.find('header [data-role="navbar"] [data-role="button"]').length) {
                backbutton.hide();
            } else {
                backbutton.css('visibility', 'hidden');
            }
        }

        fetchFilteredData(param);
    });

    document.addEventListener('online', function _appOnline() {
        dataSource.online(true);
    });

    document.addEventListener('offline', function _appOffline() {
        dataSource.online(false);
    });


})(app.home);
// END_CUSTOM_CODE_homeModel