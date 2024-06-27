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
				if (oFilterGroupItem.getControl().getName() === "numberODV" || oFilterGroupItem.getControl().getName() === "luogoSped" || oFilterGroupItem.getControl().getName() === "deliveryNumber") {
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
                this.oFiltersTable.getRowMode().setRowCount(oFilterTableRows.getCount() || 1);
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

        rowSelectionChange: function(oEvent) {
            const aIndices = oEvent.getSource().getSelectedIndices();
            const oSelectButton = this.getView().byId("seleziona-btn");
            if (aIndices.length > 0)
                oSelectButton.setEnabled(true);
            else
            oSelectButton.setEnabled(false);
        },

        onSeleziona: function() {
			const aSelectedIndices = this.oFiltersTable.getSelectedIndices(); // Serve per avere gli indici selezionati sulla tabella
            //due modalità di esecuzione dei dati!!
            // Ciclo for per la variabile aSelectedIndices legata agli indici selezionati in tabella
            // path di richiamo all'array dell'oggetto --> this.oFiltersTable.getBinding() --> /data
            // occorre prima di tutto mettere un array di buffer esterno 
            // 2 modalità --> quella sotto da te scritta
			const aSelectedRows = this.oFiltersTable.getRows().filter(row => aSelectedIndices.includes(row.getIndex()));
            let aCurrentRows = JSON.parse(JSON.stringify(this.getView().getModel().getProperty("/selectedData"))); // array buffer che è la copia della proprietà "selected data" del modello
			aCurrentRows.forEach((row) => {
				row.dateUM = new Date(row.dateUM);
			});
			// SERVE A TENERE CONTO DEI RIFERIMENTI CHE SONO STATI MESSI PRECEDENTEMENTE
			// L' OBBIETTIVO è INFATTI QUELLO DI MANTENERE GLI ODV NEI RIFERIMENTI ANCHE QUANDO FACCIAMO UN'ALTRA RICERCA

			aSelectedRows.forEach(row => {
                // if (this.getView().getModel().getData().selectedData.length > 0) {
                //     aCurrentRows = this._getArrayNumeriOdvRiferimenti();
                // }

				// DEFINIAMO L'ARRAY CHE CONTERRA' I NUMEROODV DI TUTTI GLI ELEMENTI GIA' PRESENTI NEL MODELLO JSON DEI RIFERIMENTI
				// TIRIAMO FUORI IL NUMEROODV DELLA RIGA CHE STIAMO AGGIUNGENDO (QUELLA DEL FOREACH)
				//const rowNumberOdv = this._getNumeroOdvFromRow(row);
                var path = row.getBindingContext().getPath(); // percorso puntuale all'indice selezionato per riga
                var value = this.getView().getModel().getProperty(path);
                var rowNumberOdv = value.numberODV;
				const aMockData = this.getView().getModel().getData().data;
				const aElementToAdd = aMockData.filter(order => order.numberODV === rowNumberOdv); // prendo dal modello l'oggetto in cui il numberODV è uguale al
				// al numberODV della row selezionata	
				if(aElementToAdd.length>0){
					const aCheck = aCurrentRows.filter(order => aElementToAdd[0].numberODV === order.numberODV);
					if(aCheck.length===0){
						aCurrentRows.push(aElementToAdd[0]);
					}
					this.getView().getModel().setProperty("/selectedData",aCurrentRows,true);
				}
																							   		
				// if(!currentRows.includes(rowNumberOdv)) {
				// 	this.getView().getModel().getData().selectedData.push(elementToAdd);
				// }
				// const aSelectedDataModel = this.getView().getModel().getProperty("/selectedData");
			});
			this.getView().getModel().refresh(true);
			this._resetRiferimentiRowCount();
			this.getView().byId("panel-riferimenti").setVisible(true);
			this._setSelectTipologiaTo(false);
		},
        _getArrayNumeriOdvRiferimenti: function () {
			return this.getView().getModel().getData().selectedData.reduce((currentRows, row) => {
				currentRows.push(row.numberODV);
				return currentRows;
			}, []);
		},

        _getNumeroOdvFromRow: function (row) {
			return row.getCells().reduce((finalValue, cell) => {
				console.log("STOP");
				if (cell.getBindingPath("text") === 'numberODV')
					finalValue = cell.getText();
				return finalValue;
			}, "");
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

		_getKey: function(oControl) {
			return this.getView().getLocalId(oControl.getId());
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

        onReset: function () {
            const filterInputs = this.getView().getControlsByFieldGroupId("filtri-input").filter(c => c.isA("sap.m.ComboBox") || c.isA ("sap.m.DateRangeSelection") ||c.isA ("sap.m.Input"));
            const dateInputs = [];
			const normalInputs = [];
            filterInputs.forEach((input)=> {
                /* if (input.isA("sap.m.MultiComboBox") == true){
                    mulComInputs.push(input);
                } else  */if (input.isA("sap.m.DateRangeSelection") == true) {
                    dateInputs.push(input);
                } else {
					normalInputs.push(input);
				}
            });
			console.log("STOP")
            /* mulComInputs.forEach((input)=> {
                input.removeAllSelectedItems();
            }); */

            dateInputs.forEach((dateRange) => {
                dateRange.setDateValue(null);
                dateRange.setSecondDateValue(null);
            });
			normalInputs.forEach((input) => {
				input.setValue("")
			});
            // this.getView().byId('table-odv');
			this.oFiltersTable.getParent().setVisible(false);
        },

		eliminaRiferimento: function (oEvent) {
			console.log("STOP");
			const aCurrentRows = JSON.parse(JSON.stringify(this.getView().getModel().getProperty("/selectedData")));
			const indexToBeRemoved = oEvent.getSource().getParent().getParent().getBindingContext().getPath();
			aCurrentRows.splice(indexToBeRemoved, 1);
			this.getView().getModel().setProperty("/selectedData",aCurrentRows,true);
			this._resetRiferimentiRowCount();
			if(aCurrentRows.length === 0 ){
				this.getView().byId('panel-riferimenti').setVisible(false)
				this._setSelectTipologiaTo(true);
			}
		},

		apriPdf: function (oEvent) {
            const pdfViewer = new sap.m.PDFViewer();
            this.getView().addDependent(pdfViewer);
            const oRow = oEvent.getSource().getParent().getParent();
			const rowDelNumb = this._getNumeroConsegnaFromRow(oRow);
			const aCurrentRows = JSON.parse(JSON.stringify(this.getView().getModel().getProperty("/selectedData")));
			const aSelectedOrder = aCurrentRows.filter(row => row.deliveryNumber === rowDelNumb);
			console.log("STOP");
			const deliveryNumber = aSelectedOrder[0].deliveryNumber;
            const sSource = `./res/DDT_${deliveryNumber}.pdf`
            pdfViewer.setSource(sSource);
            pdfViewer.setTitle("My Custom Title");
            pdfViewer.open();
        },

		_getNumeroConsegnaFromRow: function (row) {
			return row.getCells().reduce((finalValue, cell) => {
				if (cell.getBindingPath("text") === 'deliveryNumber')
					finalValue = cell.getText();
				return finalValue;
			}, "");
		},
    });
});
