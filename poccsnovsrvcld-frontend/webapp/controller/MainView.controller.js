sap.ui.define([
    "sap/ui/core/mvc/Controller",
    'sap/ui/model/json/JSONModel',
],
function (Controller, JSONModel) {
    "use strict";

    return Controller.extend("poccsnovsrvcldfrontend.controller.MainView", {
        onInit: function () {
            
        },

        onSelectChange: function (oEvent) {
            const requestedView = oEvent.getSource().getSelectedItem().getText();
            if (requestedView === 'Ordine di vendita') {
                this.getView().byId("odv-view").setVisible(true);
                this.getView().byId("doccon-view").setVisible(false);
            } else if (requestedView === 'Documento di consegna') {
                this.getView().byId("doccon-view").setVisible(true);
                this.getView().byId("odv-view").setVisible(false);
            } else {
                this.getView().byId("doccon-view").setVisible(false);
                this.getView().byId("odv-view").setVisible(false);
            }
        },
    });
});
