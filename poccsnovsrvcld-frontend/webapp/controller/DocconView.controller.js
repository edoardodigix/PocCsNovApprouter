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
                    row.dateUM = new Date(row.dateUM);
                });
            });
            // DEFINIZIONE DEI COMPONENTI CHE RICHIAMEREMO TANTE VOLTE NEL CODICE
            this.oFiltersTable = this.getView().byId("filters-table");
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
        },

        rowSelectionChange: function(oEvent) {
            const aIndices = oEvent.getSource().getSelectedIndices();
            const oSelectButton = this.getView().byId("seleziona-btn");
            if (aIndices.length > 0)
                oSelectButton.setEnabled(true);
            else
            oSelectButton.setEnabled(false);
        },

        onSeleziona: function() {
			const aSelectedIndices = this.oFiltersTable.getSelectedIndices();
			const aSelectedRows = this.oFiltersTable.getRows().filter(row => aSelectedIndices.includes(row.getIndex()));
            console.log("STOP");
			aSelectedRows.forEach(row => {
				// DEFINIAMO L'ARRAY CHE CONTERRA' I NUMEROODV DI TUTTI GLI ELEMENTI GIA' PRESENTI NEL MODELLO JSON DEI RIFERIMENTI
				const currentRows = this._getArrayNumeriOdvRiferimenti();
				// TIRIAMO FUORI IL NUMEROODV DELLA RIGA CHE STIAMO AGGIUNGENDO (QUELLA DEL FOREACH)
				const rowNumeroOdv = this._getNumeroOdvFromRow(row);
				const aMockData = this.getView().getModel().getData().data;
				const elementToAdd = aMockData.filter(row => row.numberODV === rowNumeroOdv)[0];
				if(!currentRows.includes(rowNumeroOdv)) {
					this.getView().getModel().getData().selectedData.push(elementToAdd);
				}
			});
			this.getView().getModel().refresh(true);
			this._resetRiferimentiRowCount();
			this.getView().byId("riferimenti-panel").setVisible(true);
			this._setSelectTipologiaTo(false);
		},

        _getArrayNumeriOdvRiferimenti: function () {
            console.log("STOP");
			return this.getView().getModel().getData().selectedData.reduce((currentRows, row) => {
				currentRows.push(row.numberODV);
				return currentRows;
			}, []);
		},

        _getNumeroOdvFromRow: function (row) {
			return row.getCells().reduce((finalValue, cell) => {
				if (cell.getBindingPath("text") === 'numberODV')
					finalValue = cell.getText();
				return finalValue;
			}, "");
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
        onOpenPdf: function (oEvent) {
            const pdfViewer = new sap.m.PDFViewer();
            this.getView().addDependent(pdfViewer);
            const odvNumber = oEvent.getSource().getParent().getParent().getCells()[0].getText();

            const sSource = `./res/ODV_${odvNumber}.pdf`
            pdfViewer.setSource(sSource);
            pdfViewer.setTitle("My Custom Title");
            pdfViewer.open();
        },
    });
});
