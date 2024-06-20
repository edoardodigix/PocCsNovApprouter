sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    'sap/ui/model/Filter',
	'sap/ui/model/FilterOperator',
    'sap/m/p13n/Engine',
	'sap/m/p13n/MetadataHelper',
	'sap/m/p13n/SelectionController',
	'sap/m/p13n/SortController',
	'sap/m/p13n/GroupController',
	'sap/m/table/ColumnWidthController',
	'sap/ui/core/library',
	'sap/ui/model/Sorter',
],
function (Controller, JSONModel, Filter, FilterOperator,
    Engine, MetadataHelper, SelectionController, SortController, GroupController, ColumnWidthController, CoreLibrary, Sorter) {
    "use strict";

    
    return Controller.extend("poccsnovsrvcldfrontend.controller.DocconView", {
        
        onInit: function () {
            this.oJSONModel = new JSONModel();
            this.oJSONModel.loadData(sap.ui.require.toUrl("poccsnovsrvcldfrontend/data/docConsModel.json"))
            .then(() => {
                this.getView().setModel(this.oJSONModel);
                this.getView().getModel().getData().data
                .forEach(row => {
                    row.dateODV = new Date(row.dateODV);
                    row.dateUM = new Date(row.dateUM);
                });
            });
            // DEFINIZIONE DEI COMPONENTI CHE RICHIAMEREMO TANTE VOLTE NEL CODICE
            this.oFiltersTable = this.getView().byId("filters-table");
        },

        onOpenPdf: function (oEvent) {
            const pdfViewer = new sap.m.PDFViewer();
            this.getView().addDependent(pdfViewer);
            const odvNumber = oEvent.getSource().getParent().getParent().getCells()[0].getText();

            const sSource = `./res/ODV_${odvNumber}.pdf`
            pdfViewer.setSource(sSource);
            pdfViewer.setTitle("My Custom Title");
            pdfViewer.open();
        },

        onReset: function () {
            console.log("STOP");
            const filterInputs = this.getView().getControlsByFieldGroupId("filtri-input").filter(c => c.isA("sap.m.MultiComboBox") || c.isA ("sap.m.DateRangeSelection"));
            let mulComInputs = [] ;
            let dateInputs = [];
            filterInputs.forEach((input)=> {
                if (input.isA("sap.m.MultiComboBox") == true){
                    mulComInputs.push(input);
                } else if (input.isA("sap.m.DateRangeSelection") == true) {
                    dateInputs.push(input);
                }
            });
            mulComInputs.forEach((input)=> {
                input.removeAllSelectedItems();
            })

            dateInputs.forEach((dateRange) => {
                dateRange.setDateValue(null);
                dateRange.setSecondDateValue(null);
            })
            this.getView().byId("filtri-btn").setEnabled(false);
            // this.getView().byId('table-odv');

        },

        onSelectRow: function(oEvent) {
            const aIndices = oEvent.getSource().getSelectedIndices();
            const oSelectButton = this.getView().byId("table-odv-btn-seleziona");
            if (aIndices.length > 0)
                oSelectButton.setEnabled(true);
            else
                oSelectButton.setEnabled(false);
        },

        onSelectButtonPress: function() {
            const aRows = this.getView().byId("table-odv").getRows();
            let selectedData = this.getView().getModel().getData().selectedData;
            let newRowCells;
            let newData = {};
            const aIndices = this.getView().byId("table-odv").getSelectedIndices();

            aIndices.forEach((index) => {
                newRowCells = aRows.at(index).getCells();
                newData.numberODV = newRowCells[0].getProperty("text");
                newData.deliveryNumber = newRowCells[1].getProperty("text");
                newData.destinatarioMerci = newRowCells[2].getProperty("text");
                newData.indirizzoDest = newRowCells[3].getProperty("text");
                newData.dateODV = newRowCells[4].getProperty("text");
                newData.dateUM = newRowCells[5].getProperty("text");
                newData.no_packages = newRowCells[6].getProperty("text");
                newData.trasportatore = newRowCells[7].getProperty("text"); 
                newData.luogoSped = newRowCells[8].getProperty("text");
                newData.status = newRowCells[9].getProperty("text");

                // Check se il dato è già presente tra i selectedData
                if (selectedData.length == 0)
                    selectedData.push(newData);
                else {
                    let count = 0;
                    selectedData.forEach((data) => {
                        if (newData.numberODV != data.numberODV)
                            ++count;
                    });
                    if (count == selectedData.length)
                        selectedData.push(newData);
                }
                newData = {};
            });

            // sampleData.selectedData = selectedData;
            const beforeData = this.getView().getModel().getData().data;
            this.getView().getModel().setData({'data': beforeData, 'selectedData': selectedData});

            this.getView().byId("table-riferimenti-row-mode").setRowCount(selectedData.length);
            this.getView().byId("panel-riferimenti").setVisible(true);
            // Accediamo ad un elemento di un'altra View
            const ownerId = this.getView()._sOwnerId;
            const viewName = "MainView";
            const elementId = "select-tipologia";
            sap.ui.getCore().byId(`${ownerId}---${viewName}--${elementId}`).setEnabled(false);
        },

        onInputChange: function () {
            // Resa la funzione standard per qualsiasi numero di input che abbiamo 
            const filterInputs = this.getView().getControlsByFieldGroupId("filtri-input").filter(c => c.isA("sap.m.MultiComboBox") || c.isA ("sap.m.DateRangeSelection"));
            const btn = this.getView().byId("filtri-btn");
            let mulComInputs = [] ;
            let dateInputs = [];
            filterInputs.forEach((input)=> {
                if (input.isA("sap.m.MultiComboBox") == true){
                    mulComInputs.push(input);
                } else if (input.isA("sap.m.DateRangeSelection") == true) {
                    dateInputs.push(input);
                }
            });
            let selectedCombos = mulComInputs.filter((input) => input.getSelectedItems().length > 0);
            let selectedDates = dateInputs.filter((dateRange) => dateRange.getDateValue() !== null);
            if(selectedCombos.length == 0 && selectedDates.length == 0)
                btn.setEnabled(false);
            else
                btn.setEnabled(true);
        },

        onDeleteRiferimentiPress: function(oEvent) {
            const oModel = this.getView().getModel();
            const initialData = oModel.getData();
            let newData = initialData.selectedData;
            const rowToRemove = oEvent.getSource().getParent().getParent().getCells()[0].getProperty("text");
            for (let i = 0; i < newData.length; ++i) {
                if (initialData.selectedData[i].numberODV === rowToRemove)
                newData.splice(i, 1);
            }
            initialData.selectedData = newData;
            const beforeData = initialData.selectedData;
            this.getView().getModel().setData({'data': initialData.data, 'selectedData': beforeData});
            this.getView().byId("table-riferimenti-row-mode").setRowCount(newData.length);
            if (newData.length === 0) {
                this.getView().byId("panel-riferimenti").setVisible(false);
                const ownerId = this.getView()._sOwnerId;
                const viewName = "MainView";
                const elementId = "select-tipologia";
                sap.ui.getCore().byId(`${ownerId}---${viewName}--${elementId}`).setEnabled(true);
            }
        },

        onCerca: function() {
            // DEFINIZIONE DEI COMPONENTI CHE RICHIAMEREMO NELLA FUNZIONE
            const oFilterBar = this.getView().byId("filters-bar");
            const oFilterErrorMsg = this.getView().byId("filter-error-msg");
            const oFilterTableRows = this.oFiltersTable.getBinding("rows");
            // FUNZIONE PER GESTIRE I FILTRI
            const aTableFilters = oFilterBar.getFilterGroupItems().reduce(function (aResult, oFilterGroupItem) {
                console.log("STOP");
                if (oFilterGroupItem.getControl().getBindingInfo("items") !== undefined) {
				// GESTIONE DEI FILTRI MULTICOMBOBOX
					const oControl = oFilterGroupItem.getControl(),
						aSelectedKeys = oControl.getSelectedKeys(),
						aFilters = aSelectedKeys.map(function (sSelectedKey) {
							return new Filter({
								path: oFilterGroupItem.getName(),
								operator: FilterOperator.Contains,
								value1: sSelectedKey
							});
						});
					if (aSelectedKeys.length > 0) {
						aResult.push(new Filter({
							filters: aFilters,
							and: false
						}));
					}
				} else {
				// GESTIONE DEI FILTRI DATERANGESELECTION
					var oControl = oFilterGroupItem.getControl(),
						aSelectedDates = [oControl.getDateValue(), oControl.getSecondDateValue()],
						oFilter = new Filter({
							path: oFilterGroupItem.getName(),
							operator: FilterOperator.BT,
							value1: aSelectedDates[0],
							value2: aSelectedDates[1]
						});
					if (!aSelectedDates[0] == false) {
						aResult.push(oFilter)
					}
				}
				return aResult;
			}, []);
            if (aTableFilters.length === 0)
                oFilterErrorMsg.setVisible(true);
            else {
                oFilterErrorMsg.setVisible(false);
                oFilterTableRows.filter(aTableFilters);
                // FACCIAMO OPERAZIONI DI LAYOUT SULLA TABELLA DOPO L'APPLICAZIONE DEI FILTRI
                this.oFiltersTable.getParent().setVisible(true);
                this.oFiltersTable.getRowMode().setRowCount(oFilterTableRows.getCount());
            }
        }
    });
});
