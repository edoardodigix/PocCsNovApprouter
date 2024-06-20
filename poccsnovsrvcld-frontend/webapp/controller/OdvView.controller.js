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

    return Controller.extend("poccsnovsrvcldfrontend.controller.OdvView", {
        onInit: function () {
            this.oModel = new JSONModel();
            this.oModel.loadData(sap.ui.require.toUrl("poccsnovsrvcldfrontend/data/odvmodel.json"))
            .then(() => {
                this.getView().setModel(this.oModel);
                this.getView().getModel().getData().MockData
                .forEach(row => {
                    row.DataOdv = new Date(row.DataOdv);
                });
            });
            // DEFINIZIONE DEI COMPONENTI CHE RICHIAMEREMO TANTE VOLTE NEL CODICE
            this.oFiltersTable = this.getView().byId("filters-table");
			this.oRiferimentiTable = this.getView().byId("riferimenti-table");

            // INIZIALIZIAMO L'ENGINE PER LA SMART TABLE
            // this._registerForP13n();
			// this._registerForP13n_rif();
        },

        onCerca: function () {
            // DEFINIZIONE DEI COMPONENTI CHE RICHIAMEREMO NELLA FUNZIONE
            const oFilterBar = this.getView().byId("filters-bar");
            const oFilterErrorMsg = this.getView().byId("filter-error-msg");
            const oFilterTableRows = this.oFiltersTable.getBinding("rows");
            // FUNZIONE PER GESTIRE I FILTRI
            const aTableFilters = oFilterBar.getFilterGroupItems().reduce(function (aResult, oFilterGroupItem) {
				if (oFilterGroupItem.getGroupName() === 'MultiComboBox') {
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

        onReset: function () {
            const filterInputs = this.getView().getControlsByFieldGroupId("filtri-input").filter(c => c.isA("sap.m.MultiComboBox") || c.isA ("sap.m.DateRangeSelection"));
            const mulComInputs = [] ;
            const dateInputs = [];
            filterInputs.forEach((input)=> {
                if (input.isA("sap.m.MultiComboBox"))
                    mulComInputs.push(input);
                else if (input.isA("sap.m.DateRangeSelection"))
                    dateInputs.push(input);
            });
            mulComInputs.forEach(multiComboBox => {
                multiComboBox.removeAllSelectedItems();
            });
            dateInputs.forEach((dateRange) => {
                dateRange.setDateValue(null);
                dateRange.setSecondDateValue(null);
            });
            this.oFiltersTable.getParent().setVisible(false);
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
			aSelectedRows.forEach(row => {
				// DEFINIAMO L'ARRAY CHE CONTERRA' I NUMEROODV DI TUTTI GLI ELEMENTI GIA' PRESENTI NEL MODELLO JSON DEI RIFERIMENTI
				const currentRows = this._getArrayNumeriOdvRiferimenti();
				// TIRIAMO FUORI IL NUMEROODV DELLA RIGA CHE STIAMO AGGIUNGENDO (QUELLA DEL FOREACH)
				const rowNumeroOdv = this._getNumeroOdvFromRow(row);
				if(!currentRows.includes(rowNumeroOdv)) {
					this.getView().getModel().getData().Riferimenti.push(
						{
							// IL NOME DELLA PROPRIETA' VA CALCOLATO DINAMICAMENTE, NEL CASO IN CUI L'UTENTE ABBIA RIORDINATO LE COLONNE
							[row.getCells()[0].getBindingInfo("text").parts[0].path]: row.getCells()[0].getText(),
							[row.getCells()[1].getBindingInfo("text").parts[0].path]: row.getCells()[1].getText(),
							[row.getCells()[2].getBindingInfo("text").parts[0].path]: row.getCells()[2].getText(),
							[row.getCells()[3].getBindingInfo("text").parts[0].path]: row.getCells()[3].getText(),
							[row.getCells()[4].getBindingInfo("text").parts[0].path]: row.getCells()[4].getText()
						}
					);
				}
			});
			this.getView().getModel().refresh(true);
			this._resetRiferimentiRowCount();
			this.getView().byId("riferimenti-panel").setVisible(true);
			this._setSelectTipologiaTo(false);
		},

		eliminaRiferimento: function (oEvent) {
			const row = oEvent.getSource().getParent().getParent();
			const numeroOdv = this._getNumeroOdvFromRow(row);
			const indexToRemove = this._getArrayNumeriOdvRiferimenti().indexOf(numeroOdv);
			this.getView().getModel().getData().Riferimenti.splice(indexToRemove, 1);
			this.getView().getModel().refresh(true);
			this._resetRiferimentiRowCount();
			if (this.getView().getModel().getData().Riferimenti.length === 0) {
				this.getView().byId("riferimenti-panel").setVisible(false);
				this._setSelectTipologiaTo(true);
			}
		},

		apriPdf: function (oEvent) {
            const pdfViewer = new sap.m.PDFViewer();
            this.getView().addDependent(pdfViewer);
            const oRow = oEvent.getSource().getParent().getParent();
			const numeoOdv = this._getNumeroOdvFromRow(oRow);

            const sSource = `./res/ODV_${numeoOdv}.pdf`
            pdfViewer.setSource(sSource);
            pdfViewer.setTitle("My Custom Title");
            pdfViewer.open();
        },

		// UTILITY FUNTIONS PRIVATE

		_getNumeroOdvFromRow: function (row) {
			return row.getCells().reduce((finalValue, cell) => {
				if (cell.getBindingPath("text") === 'NumeroOdv')
					finalValue = cell.getText();
				return finalValue;
			}, "");
		},

		_getArrayNumeriOdvRiferimenti: function () {
			return this.getView().getModel().getData().Riferimenti
			.reduce((currentRows, row) => {
				currentRows.push(row.NumeroOdv);
				return currentRows;
			}, []);
		},

		_resetRiferimentiRowCount: function () {
			const oRiferimentiTable = this.getView().byId("riferimenti-table");
			const oRiferimentiTableRows = oRiferimentiTable.getBinding("rows");
			oRiferimentiTable.getRowMode().setRowCount(oRiferimentiTableRows.getCount());
		},

		_setSelectTipologiaTo: function (enabled) {
			// RECUPERIAMO L'ELEMENTO SELECT DA UN'ALTRA VIEW
			const ownerId = this.getView()._sOwnerId;
			const viewName = "MainView";
			const elementId = "select-tipologia";
			sap.ui.getCore().byId(`${ownerId}---${viewName}--${elementId}`).setEnabled(enabled);
		},

        // FUNZIONI PER RENDERE LA SAP UI TABLE IN UNA SMART TABLE (SELEZIONE COLONNE E SORTING ABILITATI)

        _registerForP13n: function () {
			this.oMetadataHelper = new MetadataHelper([{
					key: "numeroodv-col",
					label: "N. OdV",
					path: "NumeroOdv"
				},
				{
					key: "dataodv-col",
					label: "Data OdV",
					path: "DataOdv"
				},
				{
					key: "numeroodacliente-col",
					label: "N. OdA Cliente",
					path: "NumeroOdaCliente"
				},
				{
					key: "valore-col",
					label: "Valore",
					path: "Valore"
				},
                {
					key: "stato-col",
					label: "Stato",
					path: "Stato"
				}
			]);
			try {Engine.getInstance().deregister(this.oRiferimentiTable)} catch (error) {/* Non ci interessa gestire l'errore */};
			Engine.getInstance().register(this.oFiltersTable, {
				helper: this.oMetadataHelper,
				controller: {
					Columns: new SelectionController({
						targetAggregation: "columns",
						control: this.oFiltersTable
					}),
					Sorter: new SortController({
						control: this.oFiltersTable
					}),
					Groups: new GroupController({
						control: this.oFiltersTable
					}),
					ColumnWidth: new ColumnWidthController({
						control: this.oFiltersTable
					})
				}
			});
			Engine.getInstance().stateHandlerRegistry.mEventRegistry = {}
			Engine.getInstance().attachStateChange(this.handleStateChange.bind(this));
		},

        _getKey: function(oControl) {
			return this.getView().getLocalId(oControl.getId());
		},

        handleStateChange: function(oEvent) {
			const oState = oEvent.getParameter("state");
			if (!oState) {
				return;
			}

			this.oFiltersTable.getColumns().forEach(function(oColumn) {

				const sKey = this._getKey(oColumn);
				const sColumnWidth = oState.ColumnWidth[sKey];

				oColumn.setWidth(sColumnWidth);

				oColumn.setVisible(false);
				oColumn.setSortOrder(CoreLibrary.SortOrder.None);
			}.bind(this));

			oState.Columns.forEach(function(oProp, iIndex) {
				const oCol = this.byId(oProp.key);
				oCol.setVisible(true);

				this.oFiltersTable.removeColumn(oCol);
				this.oFiltersTable.insertColumn(oCol, iIndex);
			}.bind(this));

			const aSorter = [];
			oState.Sorter.forEach(function(oSorter) {
				const oColumn = this.byId(oSorter.key);
				oColumn.setSorted(true);
				oColumn.setSortOrder(oSorter.descending ? CoreLibrary.SortOrder.Descending : CoreLibrary.SortOrder.Ascending);
				aSorter.push(new Sorter(this.oMetadataHelper.getProperty(oSorter.key).path, oSorter.descending));
			}.bind(this));
			this.oFiltersTable.getBinding("rows").sort(aSorter);
		},

        openColumnSelection: function (oEvent) {

			this._registerForP13n();

            const that = this;
            
			Engine.getInstance().show(that.oFiltersTable, ["Columns", "Sorter"], {
				contentHeight: "35rem",
				contentWidth: "32rem",
				source: oEvent.getSource()
			});
		},

        onSort: function(oEvent) {
			const sAffectedProperty = this._getKey(oEvent.getParameter("column"));
			const sSortOrder = oEvent.getParameter("sortOrder");
            const that = this;

			//Apply the state programatically on sorting through the column menu
			//1) Retrieve the current personalization state
			Engine.getInstance().retrieveState(that.oFiltersTable).then(function(oState) {

				//2) Modify the existing personalization state --> clear all sorters before
				oState.Sorter.forEach(function(oSorter) {
					oSorter.sorted = false;
				});
				oState.Sorter.push({
					key: sAffectedProperty,
					descending: sSortOrder === CoreLibrary.SortOrder.Descending
				});

				//3) Apply the modified personalization state to persist it in the VariantManagement
				Engine.getInstance().applyState(that.oFiltersTable, oState);
			});
		},

		onColumnMove: function(oEvent) {
			const oAffectedColumn = oEvent.getParameter("column");
			const iNewPos = oEvent.getParameter("newPos");
			const sKey = this._getKey(oAffectedColumn);
            const that = this;

			oEvent.preventDefault();

			Engine.getInstance().retrieveState(that.oFiltersTable).then(function(oState) {

				const oCol = oState.Columns.find(function(oColumn) {
					return oColumn.key === sKey;
				}) || {
					key: sKey
				};
				oCol.position = iNewPos;

				Engine.getInstance().applyState(that.oFiltersTable, {
					Columns: [oCol]
				});
			});
		},

		onColumnResize: function(oEvent) {
			const oColumn = oEvent.getParameter("column");
			const sWidth = oEvent.getParameter("width");
            const that = this;

			const oColumnState = {};
			oColumnState[this._getKey(oColumn)] = sWidth;

			Engine.getInstance().applyState(that.oFiltersTable, {
				ColumnWidth: oColumnState
			});
		},

		// PER LA TABELLA RIFERIMENTI

		_registerForP13n_rif: function () {
			this.oMetadataHelper_rif = new MetadataHelper([{
					key: "numeroodv-col-rif",
					label: "N. OdV",
					path: "NumeroOdv"
				},
				{
					key: "dataodv-col-rif",
					label: "Data OdV",
					path: "DataOdv"
				},
				{
					key: "numeroodacliente-col-rif",
					label: "N. OdA Cliente",
					path: "NumeroOdaCliente"
				},
				{
					key: "valore-col-rif",
					label: "Valore",
					path: "Valore"
				},
                {
					key: "stato-col-rif",
					label: "Stato",
					path: "Stato"
				},
				{
					key: "azioni-rif",
					label: "Azioni",
					visible: false
				}
			]);
			try {Engine.getInstance().deregister(this.oFiltersTable)} catch (error) {/* Non ci interessa gestire l'errore */};
			Engine.getInstance().register(this.oRiferimentiTable, {
				helper: this.oMetadataHelper_rif,
				controller: {
					Columns: new SelectionController({
						targetAggregation: "columns",
						control: this.oRiferimentiTable
					}),
					Sorter: new SortController({
						control: this.oRiferimentiTable
					}),
					Groups: new GroupController({
						control: this.oRiferimentiTable
					}),
					ColumnWidth: new ColumnWidthController({
						control: this.oRiferimentiTable
					})
				}
			});
			Engine.getInstance().stateHandlerRegistry.mEventRegistry = {}
			Engine.getInstance().attachStateChange(this.handleStateChange_rif.bind(this));
		},

        _getKey_rif: function(oControl) {
			return this.getView().getLocalId(oControl.getId());
		},

        handleStateChange_rif: function(oEvent) {
			const oState = oEvent.getParameter("state");
			if (!oState) {
				return;
			}

			this.oRiferimentiTable.getColumns().forEach(function(oColumn) {
				const sKey = this._getKey_rif(oColumn);
				if (sKey != "azioni-rif") {
					const sColumnWidth = oState.ColumnWidth[sKey];

					oColumn.setWidth(sColumnWidth);

					oColumn.setVisible(false);
					oColumn.setSortOrder(CoreLibrary.SortOrder.None);
				}
			}.bind(this));

			oState.Columns.forEach(function(oProp, iIndex) {
				const oCol = this.byId(oProp.key);
				oCol.setVisible(true);

				this.oRiferimentiTable.removeColumn(oCol);
				this.oRiferimentiTable.insertColumn(oCol, iIndex);
			}.bind(this));

			const aSorter = [];
			oState.Sorter.forEach(function(oSorter) {
				const oColumn = this.byId(oSorter.key);
				oColumn.setSorted(true);
				oColumn.setSortOrder(oSorter.descending ? CoreLibrary.SortOrder.Descending : CoreLibrary.SortOrder.Ascending);
				aSorter.push(new Sorter(this.oMetadataHelper_rif.getProperty(oSorter.key).path, oSorter.descending));
			}.bind(this));
			this.oRiferimentiTable.getBinding("rows").sort(aSorter);
		},

        openColumnSelection_rif: function (oEvent) {

			this._registerForP13n_rif();

            const that = this;
            
			Engine.getInstance().show(that.oRiferimentiTable, ["Columns", "Sorter"], {
				contentHeight: "35rem",
				contentWidth: "32rem",
				source: oEvent.getSource()
			});
		},

        onSort_rif: function(oEvent) {
			const sAffectedProperty = this._getKey(oEvent.getParameter("column"));
			const sSortOrder = oEvent.getParameter("sortOrder");
            const that = this;

			//Apply the state programatically on sorting through the column menu
			//1) Retrieve the current personalization state
			Engine.getInstance().retrieveState(that.oRiferimentiTable).then(function(oState) {

				//2) Modify the existing personalization state --> clear all sorters before
				oState.Sorter.forEach(function(oSorter) {
					oSorter.sorted = false;
				});
				oState.Sorter.push({
					key: sAffectedProperty,
					descending: sSortOrder === CoreLibrary.SortOrder.Descending
				});

				//3) Apply the modified personalization state to persist it in the VariantManagement
				Engine.getInstance().applyState(that.oRiferimentiTable, oState);
			});
		},

		onColumnMove_rif: function(oEvent) {
			const oAffectedColumn = oEvent.getParameter("column");
			const iNewPos = oEvent.getParameter("newPos");
			const sKey = this._getKey(oAffectedColumn);
            const that = this;

			oEvent.preventDefault();

			Engine.getInstance().retrieveState(that.oRiferimentiTable).then(function(oState) {

				const oCol = oState.Columns.find(function(oColumn) {
					return oColumn.key === sKey;
				}) || {
					key: sKey
				};
				oCol.position = iNewPos;

				Engine.getInstance().applyState(that.oRiferimentiTable, {
					Columns: [oCol]
				});
			});
		},

		onColumnResize_rif: function(oEvent) {
			const oColumn = oEvent.getParameter("column");
			const sWidth = oEvent.getParameter("width");
            const that = this;

			const oColumnState = {};
			oColumnState[this._getKey(oColumn)] = sWidth;

			Engine.getInstance().applyState(that.oRiferimentiTable, {
				ColumnWidth: oColumnState
			});
		},
    });
});