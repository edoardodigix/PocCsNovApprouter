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
                this.getView().byId("docconsprod-view").setVisible(false);
                this.getView().byId("docConLot-view").setVisible(false);
            } else if (requestedView === 'Documento di consegna') {
                this.getView().byId("odv-view").setVisible(false);
                this.getView().byId("doccon-view").setVisible(true);
                this.getView().byId("docconsprod-view").setVisible(false);
                this.getView().byId("docConLot-view").setVisible(false);
            } else if (requestedView === 'Documento consegna prodotto') {
                this.getView().byId("odv-view").setVisible(false);
                this.getView().byId("doccon-view").setVisible(false);
                this.getView().byId("docconsprod-view").setVisible(true);
                this.getView().byId("docConLot-view").setVisible(false);
            }else if (requestedView === 'Documento consegna prodotto lotto') {
                this.getView().byId("odv-view").setVisible(false);
                this.getView().byId("doccon-view").setVisible(false);
                this.getView().byId("docconsprod-view").setVisible(false);
                this.getView().byId("docConLot-view").setVisible(true);
            }else {
                this.getView().byId("odv-view").setVisible(false);
                this.getView().byId("doccon-view").setVisible(false);
                this.getView().byId("docconsprod-view").setVisible(false);
                this.getView().byId("docConLot-view").setVisible(false);
            }

        },
    });
});
