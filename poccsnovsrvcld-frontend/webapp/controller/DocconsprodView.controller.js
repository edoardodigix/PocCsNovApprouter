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

    return Controller.extend("poccsnovsrvcldfrontend.controller.DocconsprodView", {
        onInit: function () {
            this.oModel = new JSONModel();
            this.oModel.loadData(sap.ui.require.toUrl("poccsnovsrvcldfrontend/data/docconsprodmodel.json"))
            .then(() => {
                this.getView().setModel(this.oModel);
                this.getView().getModel().getData().MockData
                .forEach(row => {
                    row.DataOdv = new Date(row.DataOdv);
					row.DataUM = new Date(row.DataUM);
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
				/* if (oFilterGroupItem.getControl().getBindingInfo("items") !== undefined) {
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
					} else  */
					if (oFilterGroupItem.getControl().getName() === "DataUM") {
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
					} else {
						// GESTIONE DEI FILTRI INPUT
						const oControl = oFilterGroupItem.getControl(),
						aSelectedKeys = oControl.getValue(),
						oFilter = new Filter({
							path: oFilterGroupItem.getName(),
							operator: FilterOperator.EQ,
							value1: aSelectedKeys,
						});
						if (aSelectedKeys) {
							aResult.push(oFilter);
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
                this.oFiltersTable.getRowMode().setRowCount(oFilterTableRows.getCount() || 1);
            }
        },

		onlyNumber: function (value) {
			if(value!=="" & value!==null && value!==undefined){
				let realValue = value.getSource().getValue();
				value.getSource().setValue(realValue.replace(/[^0-9]+/g, ""));
			}
		},

		myFormatter: function (sName) {
			var string = "";
			if(sName!=="" && sName!==undefined && sName!==null){
				//string = sName.slice(sName.indexOf('-') + 2,100); 
				if(sName.search("-")!==-1){
					string = sName.split("- ")[0];
				}
			}
			return string;
		},

        onReset: function () {
            const filterInputs = this.getView().getControlsByFieldGroupId("filtri-input").filter(c => c.isA("sap.m.ComboBox") || c.isA ("sap.m.DateRangeSelection") || c.isA ("sap.m.Input"));
            const dateInputs = [];
			const normalInputs = [];
            filterInputs.forEach((input)=> {
				if (input.isA("sap.m.DateRangeSelection") == true) {
					dateInputs.push(input);
				} else {
					normalInputs.push(input);
				}
            });
            dateInputs.forEach((dateRange) => {
                dateRange.setDateValue(null);
                dateRange.setSecondDateValue(null);
            });
			normalInputs.forEach((input) => {
				input.setValue("")
			})
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
				// DEFINIAMO L'ARRAY CHE CONTERRA' I NUMEROCONSEGNA DI TUTTI GLI ELEMENTI GIA' PRESENTI NEL MODELLO JSON DEI RIFERIMENTI
				const currentRows = this._getArrayNumeriConsegnaRiferimenti();
				// TIRIAMO FUORI IL NUMEROCONSEGNA DELLA RIGA CHE STIAMO AGGIUNGENDO (QUELLA DEL FOREACH)
				const rowNumeroConsegna = this._getNumeroConsegnaFromRow(row);
				const aMockData = this.getView().getModel().getData().MockData;
				const elementToAdd = aMockData.filter(row => row.NumeroConsegna === rowNumeroConsegna)[0];
				if(!currentRows.includes(rowNumeroConsegna)) {
					this.getView().getModel().getData().Riferimenti.push(elementToAdd);
				}
			});
			this.getView().getModel().refresh(true);
			this._resetRiferimentiRowCount();
			this.getView().byId("riferimenti-panel").setVisible(true);
			this._setSelectTipologiaTo(false);
		},

		eliminaRiferimento: function (oEvent) {
			const row = oEvent.getSource().getParent().getParent();
			const numeroConsegna = this._getNumeroConsegnaFromRow(row);
			const indexToRemove = this._getArrayNumeriConsegnaRiferimenti().indexOf(numeroConsegna);
			this.getView().getModel().getData().Riferimenti.splice(indexToRemove, 1);
			this.getView().getModel().refresh(true);
			this._resetRiferimentiRowCount();
			if (this.getView().getModel().getData().Riferimenti.length === 0) {
				this.getView().byId("riferimenti-panel").setVisible(false);
				this._setSelectTipologiaTo(true);
			}
		},

		// NON AVENDO ANCORA A DISPOSIZIONE I DOCUMENTI DI CONSEGNA, QUESTA FUNZIONE PER ORA APRE ANCORA GLI ODV
		apriPdf: function (oEvent) {
            const pdfViewer = new sap.m.PDFViewer();
            this.getView().addDependent(pdfViewer);
            const oRow = oEvent.getSource().getParent().getParent();
			const rowDelNumb = this._getNumeroConsegnaFromRow(oRow);
			const aCurrentRows = JSON.parse(JSON.stringify(this.getView().getModel().getProperty("/Riferimenti")));
			const aSelectedOrder = aCurrentRows.filter(row => row.NumeroConsegna === rowDelNumb);
			console.log("STOP");
			const NumeroConsegna = aSelectedOrder[0].NumeroConsegna;
            const sSource = `./res/DDT_${NumeroConsegna}.pdf`;
			const aPDF = this.getView().getModel().getData().PDFs;
            if(aPDF.includes(sSource)) {
				pdfViewer.setSource(sSource);
				pdfViewer.setTitle("My Custom Title");
				pdfViewer.open();
			}
        },

		apriCOA: function (oEvent) {
            const pdfViewer = new sap.m.PDFViewer();
            this.getView().addDependent(pdfViewer);
            const oRow = oEvent.getSource().getParent().getParent();
			const rowDelNumb = this._getNumeroConsegnaFromRow(oRow);
			const aCurrentRows = JSON.parse(JSON.stringify(this.getView().getModel().getProperty("/Riferimenti")));
			const aSelectedOrder = aCurrentRows.filter(row => row.NumeroConsegna === rowDelNumb);
			const NumeroConsegna = aSelectedOrder[0].NumeroConsegna;
            const sSource = `./res/COA_${NumeroConsegna}.pdf`;
			const aPDF = this.getView().getModel().getData().PDFs;

			if(aPDF.includes(sSource)) {
				pdfViewer.setSource(sSource);
				pdfViewer.setTitle("My Custom Title");
				pdfViewer.open();
			}
            /* 
			try {
			} catch (error) {
				console.warn(error);
			} */
        },


		apriCMR: function (oEvent) {
            const pdfViewer = new sap.m.PDFViewer();
            this.getView().addDependent(pdfViewer);
            const oRow = oEvent.getSource().getParent().getParent();
			const rowDelNumb = this._getNumeroConsegnaFromRow(oRow);
			const aCurrentRows = JSON.parse(JSON.stringify(this.getView().getModel().getProperty("/Riferimenti")));
			const aSelectedOrder = aCurrentRows.filter(row => row.NumeroConsegna === rowDelNumb);
			const NumeroConsegna = aSelectedOrder[0].NumeroConsegna;
            const sSource = `./res/CMR_${NumeroConsegna}.pdf`;
			const aPDF = this.getView().getModel().getData().PDFs;

			if(aPDF.includes(sSource)) {
				pdfViewer.setSource(sSource);
				pdfViewer.setTitle("My Custom Title");
				pdfViewer.open();
			}
        },

		apriPKL: function (oEvent) {
            const pdfViewer = new sap.m.PDFViewer();
            this.getView().addDependent(pdfViewer);
            const oRow = oEvent.getSource().getParent().getParent();
			const rowDelNumb = this._getNumeroConsegnaFromRow(oRow);
			const aCurrentRows = JSON.parse(JSON.stringify(this.getView().getModel().getProperty("/Riferimenti")));
			const aSelectedOrder = aCurrentRows.filter(row => row.NumeroConsegna === rowDelNumb);
			const NumeroConsegna = aSelectedOrder[0].NumeroConsegna;
            const sSource = `./res/PKL_${NumeroConsegna}.pdf`;
			const aPDF = this.getView().getModel().getData().PDFs;

			if(aPDF.includes(sSource)) {
				pdfViewer.setSource(sSource);
				pdfViewer.setTitle("My Custom Title");
				pdfViewer.open();
			}
        },

		// UTILITY FUNTIONS PRIVATE

		_getNumeroOdvFromRow: function (row) {
			return row.getCells().reduce((finalValue, cell) => {
				if (cell.getBindingPath("text") === 'NumeroOdv')
					finalValue = cell.getText();
				return finalValue;
			}, "");
		},

		_getNumeroConsegnaFromRow: function (row) {
			return row.getCells().reduce((finalValue, cell) => {
				if (cell.getBindingPath("text") === 'NumeroConsegna')
					finalValue = cell.getText();
				return finalValue;
			}, "");
		},

		_getArrayNumeriConsegnaRiferimenti: function () {
			return this.getView().getModel().getData().Riferimenti
			.reduce((currentRows, row) => {
				currentRows.push(row.NumeroConsegna);
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
					key: "numeroconsegna-col",
					label: "N. Consegna",
					path: "NumeroConsegna",
					visible: false
				},
				{
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
					key: "destinatariomerci-col",
					label: "Destinatario Merci",
					path: "DestinatarioMerci"
				},
                {
					key: "indirizzodestinatariomerci-col",
					label: "Indirizzo Destinatario Merci",
					path: "IndirizzoDestinatarioMerci"
				},
				{
					key: "dataum-col",
					label: "Data UM",
					path: "DataUM"
				},
				{
					key: "numerocolli-col",
					label: "N. Colli",
					path: "NumeroColli"
				},
				{
					key: "trasportatore-col",
					label: "Trasportatore",
					path: "Trasportatore"
				},
				{
					key: "luogospedizione-col",
					label: "Luogo Sped.",
					path: "LuogoSpedizione"
				},
				{
					key: "quantita-col",
					label: "Quantità",
					path: "Quantità"
				},
				{
					key: "um-col",
					label: "UM",
					path: "UM"
				},
				{
					key: "materialecliente-col",
					label: "Materiale Cliente",
					path: "MaterialeCliente"
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
			Engine.getInstance().attachStateChange(this.handleStateChange.bind(this, this.oFiltersTable));
		},

        _getKey: function(oControl) {
			return this.getView().getLocalId(oControl.getId());
		},

        handleStateChange: function(oTable, oEvent) {
			const oState = oEvent.getParameter("state");
			if (!oState) {
				return;
			}

			// AGGIUNGIAMO SEMPRE LA COLONNA DEL NUMEROCONSEGNA ALL'INIZIO, COSI' DA AVERLA SEMPRE PER PRIMA NELLA TABELLA
			if (/Riferimenti/.test(oTable.getBindingPath("rows")))
				oState.Columns.unshift({'key': 'numeroconsegna-col-rif'});
			else
				oState.Columns.unshift({'key': 'numeroconsegna-col'});

			oTable.getColumns().forEach(function(oColumn) {

				// CODICE PER CAMBIARE LA LARGHEZZA DELLE COLONNE
				// const sKey = this._getKey(oColumn);
				// const sColumnWidth = oState.ColumnWidth[sKey];
				// oColumn.setWidth(sColumnWidth);
				// EVITIAMO DI TOGLIERE LA COLONNA DELLE AZIONI
				if (!oColumn.getSortProperty() == false) {
					oColumn.setVisible(false);
					oColumn.setSortOrder(CoreLibrary.SortOrder.None);
				}

			}.bind(this));

			oState.Columns.forEach(function(oProp, iIndex) {
				const oCol = this.byId(oProp.key);
				oCol.setVisible(true);

				oTable.removeColumn(oCol);
				oTable.insertColumn(oCol, iIndex);
			}.bind(this));

			const aSorter = [];
			oState.Sorter.forEach(function(oSorter) {
				const oColumn = this.byId(oSorter.key);
				oColumn.setSorted(true);
				oColumn.setSortOrder(oSorter.descending ? CoreLibrary.SortOrder.Descending : CoreLibrary.SortOrder.Ascending);
				aSorter.push(new Sorter(this.oMetadataHelper.getProperty(oSorter.key).path, oSorter.descending));
			}.bind(this));
			oTable.getBinding("rows").sort(aSorter);
		},

        openColumnSelection: function (oEvent) {

            const table = oEvent.getSource().getParent().getParent();

			if (/Riferimenti/.test(oEvent.getSource().getParent().getParent().getBindingPath("rows")))
				this._registerForP13n_rif();
			else
				this._registerForP13n();
            
			Engine.getInstance().show(table, ["Columns", "Sorter"], {
				contentHeight: "35rem",
				contentWidth: "32rem",
				source: oEvent.getSource()
			});
		},

        onSort: function(oEvent) {
			const sAffectedProperty = this._getKey(oEvent.getParameter("column"));
			const sSortOrder = oEvent.getParameter("sortOrder");
            const table = oEvent.getSource();

			//Apply the state programatically on sorting through the column menu
			//1) Retrieve the current personalization state
			Engine.getInstance().retrieveState(table).then(function(oState) {

				//2) Modify the existing personalization state --> clear all sorters before
				oState.Sorter.forEach(function(oSorter) {
					oSorter.sorted = false;
				});
				oState.Sorter.push({
					key: sAffectedProperty,
					descending: sSortOrder === CoreLibrary.SortOrder.Descending
				});

				//3) Apply the modified personalization state to persist it in the VariantManagement
				Engine.getInstance().applyState(table, oState);
			});
		},

		onColumnMove: function(oEvent) {
			const oAffectedColumn = oEvent.getParameter("column");
			const iNewPos = oEvent.getParameter("newPos");
			const sKey = this._getKey(oAffectedColumn);
            const table = oEvent.getSource();

			oEvent.preventDefault();

			Engine.getInstance().retrieveState(table).then(function(oState) {

				const oCol = oState.Columns.find(function(oColumn) {
					return oColumn.key === sKey;
				}) || {
					key: sKey
				};
				oCol.position = iNewPos;

				Engine.getInstance().applyState(table, {
					Columns: [oCol]
				});
			});
		},

		onColumnResize: function(oEvent) {
			const oColumn = oEvent.getParameter("column");
			const sWidth = oEvent.getParameter("width");
            const table = oEvent.getSource();

			const oColumnState = {};
			oColumnState[this._getKey(oColumn)] = sWidth;

			Engine.getInstance().applyState(table, {
				ColumnWidth: oColumnState
			});
		},

		// PER LA TABELLA RIFERIMENTI

		_registerForP13n_rif: function () {
			this.oMetadataHelper_rif = new MetadataHelper([{
					key: "numeroconsegna-col-rif",
					label: "N. Consegna",
					path: "NumeroConsegna",
					visible: false
				},
				{
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
					key: "destinatariomerci-col-rif",
					label: "Destinatario Merci",
					path: "DestinatarioMerci"
				},
				{
					key: "indirizzodestinatariomerci-col-rif",
					label: "Indirizzo Destinatario Merci",
					path: "IndirizzoDestinatarioMerci"
				},
				{
					key: "dataum-col-rif",
					label: "Data UM",
					path: "DataUM"
				},
				{
					key: "numerocolli-col-rif",
					label: "N. Colli",
					path: "NumeroColli"
				},
				{
					key: "trasportatore-col-rif",
					label: "Trasportatore",
					path: "Trasportatore"
				},
				{
					key: "luogospedizione-col-rif",
					label: "Luogo Sped.",
					path: "LuogoSpedizione"
				},
				{
					key: "quantita-col-rif",
					label: "Quantità",
					path: "Quantità"
				},
				{
					key: "um-col-rif",
					label: "UM",
					path: "UM"
				},
				{
					key: "materialecliente-col-rif",
					label: "Materiale Cliente",
					path: "MaterialeCliente"
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
			Engine.getInstance().attachStateChange(this.handleStateChange.bind(this, this.oRiferimentiTable));
		},

    });
});