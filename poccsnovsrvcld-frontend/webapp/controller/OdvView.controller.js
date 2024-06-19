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

            // INIZIALIZIAMO L'ENGINE PER LA SMART TABLE
            this._registerForP13n();
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
    });
});