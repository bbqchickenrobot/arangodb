/*jslint indent: 2, nomen: true, maxlen: 100, sloppy: true, vars: true, white: true, plusplus: true, newcap: true */
/*global window, $, Backbone, document, arangoCollectionModel*/
/*global arangoHelper,dashboardView,arangoDatabase, _*/

(function () {
  "use strict";

  window.Router = Backbone.Router.extend({
    routes: {
      "": "dashboard",
      "dashboard": "dashboard",
      "collection/:colid": "collection",
      "collections": "collections",
      "new": "newCollection",
      "login": "login",
      "collection/:colid/documents/:pageid": "documents",
      "collection/:colid/:docid": "document",
      "shell": "shell",
      "query": "query",
      "api": "api",
      "databases": "databases",
      "applications": "applications",
      "application/documentation/:key": "appDocumentation",
      "graph": "graph",
      "graphManagement": "graphManagement",
      "graphManagement/add": "graphAddNew",
      "graphManagement/delete/:name": "graphDelete",
      "userManagement": "userManagement",
      "userProfile": "userProfile",
      "testing": "testview",
      "testModalView": "testmodalview",
      "logs": "newLogsView"
    },

    newLogsView: function() {
      if (!this.logsView) {
        var newLogsAllCollection = new window.NewArangoLogs(
          {upto: true, loglevel: 4}
        ),
        newLogsDebugCollection = new window.NewArangoLogs(
          {loglevel: 4}
        ),
        newLogsInfoCollection = new window.NewArangoLogs(
          {loglevel: 3}
        ),
        newLogsWarningCollection = new window.NewArangoLogs(
          {loglevel: 2}
        ),
        newLogsErrorCollection = new window.NewArangoLogs(
          {loglevel: 1}
        );
        this.logsView = new window.NewLogsView({
          logall: newLogsAllCollection,
          logdebug: newLogsDebugCollection,
          loginfo: newLogsInfoCollection,
          logwarning: newLogsWarningCollection,
          logerror: newLogsErrorCollection
        });
      }
      this.logsView.render();
      this.naviView.selectMenuItem('tools-menu');
    },

    testmodalview: function() {
      this.testModalView = new window.testModalView();
      this.testModalView.render();
    },

    testview: function () {
      this.testView = new window.testView();
      this.testView.render();
    },

    initialize: function () {
      // This should be the only global object
      window.modalView = new window.ModalView();
      var self = this;
      /* this.bind('all', function (trigger, args) {
       if (trigger === "route") {
         if (self.currentRoute === "dashboard" && self.dashboardView) {
           self.dashboardView.stopUpdating();
         } else if (args === "dashboard") {
           delete self.dashboardView;
         }
         self.currentRoute = args;
       }
       });*/
      this.graphs = new window.GraphCollection();
      this.notificationList = new window.NotificationCollection();

      window.currentDB = new window.CurrentDatabase();
      window.currentDB.fetch({
        async: false
      });

      window.userCollection = new window.ArangoUsers();

      window.arangoDatabase = new window.ArangoDatabase();

      window.arangoCollectionsStore = new window.arangoCollections();
      window.arangoDocumentsStore = new window.arangoDocuments();
      window.arangoDocumentStore = new window.arangoDocument();

      window.collectionsView = new window.CollectionsView({
        collection: window.arangoCollectionsStore
      });
      window.arangoCollectionsStore.fetch();
      window.documentView = new window.DocumentView({
        collection: window.arangoDocumentStore
      });
      /*
       window.arangoLogsStore = new window.ArangoLogs();
       window.arangoLogsStore.fetch({
         success: function () {
           window.logsView = new window.LogsView({
             collection: window.arangoLogsStore
           });
         }
       });
       */
      this.foxxList = new window.FoxxCollection();

      this.footerView = new window.FooterView();
      this.naviView = new window.NavigationView({
        notificationCollection: this.notificationList,
        userCollection: window.userCollection
      });
      this.footerView.render();
      this.naviView.render();
      this.graphView = new window.GraphView({
        graphs: this.graphs,
        collection: window.arangoCollectionsStore
      });


      $(window).resize(function () {
        self.handleResize();
      });
      //this.handleResize();
      window.checkVersion();
    },

    logsAllowed: function () {
      return (window.currentDB.get('name') === '_system');
    },

    checkUser: function () {
      if (window.userCollection.models.length === 0) {
        this.navigate("login", {trigger: true});
        return false;
      }
      return true;
    },

    login: function () {
      if (!this.loginView) {
        this.loginView = new window.loginView({
          collection: window.userCollection
        });
      }
      this.loginView.render();
      this.naviView.selectMenuItem('');
    },

    collections: function () {
      var naviView = this.naviView;
      window.arangoCollectionsStore.fetch({
        success: function () {
          window.collectionsView.render();
          naviView.selectMenuItem('collections-menu');
        }
      });
    },

    collection: function (colid) {
      if (!this.collectionView) {
        this.collectionView = new window.CollectionView();
      }
      this.collectionView.setColId(colid);
      this.collectionView.render();
      this.naviView.selectMenuItem('collections-menu');
    },

    documents: function (colid, pageid) {
      if (!window.documentsView) {
        window.documentsView = new window.DocumentsView({
          collection : window.arangoDocumentsStore,
          documentStore : window.arangoDocumentStore,
          collectionsStore :  window.arangoCollectionsStore
        });
      }
      window.documentsView.setCollectionId(colid, pageid);
      window.documentsView.render();

    },

    document: function (colid, docid) {
      window.documentView.colid = colid;
      window.documentView.docid = docid;
      window.documentView.render();
      var type = arangoHelper.collectionApiType(colid);
      window.documentView.type = type;
      window.documentView.typeCheck(type);
    },

    shell: function () {
      if (!this.shellView) {
        this.shellView = new window.shellView();
      }
      this.shellView.render();
      this.naviView.selectMenuItem('tools-menu');
    },

    query: function () {
      if (!this.queryView) {
        this.queryView = new window.queryView();
      }
      this.queryView.render();
      this.naviView.selectMenuItem('query-menu');
    },

    api: function () {
      if (!this.apiView) {
        this.apiView = new window.ApiView();
      }
      this.apiView.render();
      this.naviView.selectMenuItem('tools-menu');
    },

    databases: function () {
      if (arangoHelper.databaseAllowed() === true) {
        if (!this.databaseView) {
          this.databaseView = new window.databaseView({
            collection: arangoDatabase
          });
        }
        this.databaseView.render();
        this.naviView.selectMenuItem('databases-menu');
      }
      else {
        this.navigate("#", {trigger: true});
        this.naviView.selectMenuItem('dashboard-menu');
        $('#databaseNavi').css('display', 'none');
        $('#databaseNaviSelect').css('display', 'none');
      }
    },

    /*
     logs: function () {
       if (!this.logsAllowed()) {
         this.navigate('', { trigger: true });
         return;
       }

       window.arangoLogsStore.fetch({
         success: function () {
           window.logsView.render();
           $('#logNav a[href="#all"]').tab('show');
           window.logsView.initLogTables();
           window.logsView.drawTable();
           $('#all-switch').click();
         }
       });
       this.naviView.selectMenuItem('tools-menu');
     },
     */
    dashboard: function () {
      this.naviView.selectMenuItem('dashboard-menu');
      if (this.dashboardView === undefined) {
        this.dashboardView = new window.newDashboardView({
          dygraphConfig: window.newDygraphConfig
        });
      }
      this.dashboardView.render();
    },

    /*
     dashboard: function () {
       this.naviView.selectMenuItem('dashboard-menu');
       if (this.statisticsDescriptionCollection === undefined) {
         this.statisticsDescriptionCollection = new window.StatisticsDescriptionCollection();
         this.statisticsDescriptionCollection.fetch({
           async: false
         });
       }
       if (this.statistics === undefined) {
         this.statisticsCollection = new window.StatisticsCollection();
       }
       if (this.dashboardView === undefined) {
         this.dashboardView = new dashboardView({
           collection: this.statisticsCollection,
           description: this.statisticsDescriptionCollection,
           documentStore: window.arangoDocumentsStore,
           dygraphConfig: window.dygraphConfig
         });
       }
       this.dashboardView.render();
     },
     */


    graph: function () {
      var self = this;
      window.arangoCollectionsStore.fetch({
        success: function () {
          self.graphView.render();
          self.naviView.selectMenuItem('graphviewer-menu');
        }
      });
    },

    graphManagement: function () {
      if (!this.graphManagementView) {
        this.graphManagementView =
        new window.GraphManagementView({collection: this.graphs});
      }
      this.graphManagementView.render();
      this.naviView.selectMenuItem('graphviewer-menu');
    },

    graphAddNew: function () {
      if (!this.addNewGraphView) {
        this.addNewGraphView = new window.AddNewGraphView({
          collection: window.arangoCollectionsStore,
          graphs: this.graphs
        });
      }
      this.addNewGraphView.render();
      this.naviView.selectMenuItem('graphviewer-menu');
    },

    graphDelete: function (name) {
      if (!this.deleteGraphView) {
        this.deleteGraphView = new window.DeleteGraphView({
          collection: this.graphs
        });
      }
      this.deleteGraphView.render(name);
      this.naviView.selectMenuItem('graphviewer-menu');
    },

    applications: function () {
      if (this.applicationsView === undefined) {
        this.applicationsView = new window.ApplicationsView({
          collection: this.foxxList
        });
      }
      this.applicationsView.reload();
      this.naviView.selectMenuItem('applications-menu');
    },

    appDocumentation: function (key) {
      var docuView = new window.AppDocumentationView({key: key});
      docuView.render();
      this.naviView.selectMenuItem('applications-menu');
    },

    handleSelectDatabase: function () {
      this.naviView.handleSelectDatabase();
    },

    handleResize: function () {
      if (this.dashboardView) {
        this.dashboardView.resize();
      }
      var oldWidth = $('#content').width();
      var containerWidth = $(window).width() - 70;
      /*var spanWidth = 242;*/
      var spanWidth = 243;
      var divider = containerWidth / spanWidth;
      var roundDiv = parseInt(divider, 10);
      var newWidth = roundDiv * spanWidth - 2;
      /*
       var marginWidth = ((containerWidth + 30) - newWidth) / 2;
       $('#content').width(newWidth)
       .css('margin-left', marginWidth)
       .css('margin-right', marginWidth);
       */
      // $('.footer-right p').css('margin-right', marginWidth + 20);
      // $('.footer-left p').css('margin-left', marginWidth + 20);
      if (newWidth !== oldWidth) {
        this.graphView.handleResize(newWidth);
      }
    },

    userManagement: function () {
      if (!this.userManagementView) {
        this.userManagementView = new window.userManagementView({
          collection: window.userCollection
        });
      }
      this.userManagementView.render();
      this.naviView.selectMenuItem('tools-menu');
    },

    userProfile: function () {
      if (!this.userManagementView) {
        this.userManagementView = new window.userManagementView({
          collection: window.userCollection
        });
      }
      this.userManagementView.render(true);
      this.naviView.selectMenuItem('tools-menu');
    }
  });

}());
