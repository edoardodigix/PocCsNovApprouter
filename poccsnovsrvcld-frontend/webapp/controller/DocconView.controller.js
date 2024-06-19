sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/format/DateFormat"
],
function (Controller, JSONModel, DateFormat) {
    "use strict";

    const oDateFormat = DateFormat.getDateInstance({pattern: "dd/MM/yyyy", UTC: true}); 
    return Controller.extend("poccsnovsrvcldfrontend.controller.DocconView", {
        
        onInit: function () {
            const oJSONModel = new JSONModel();
            oJSONModel.loadData(sap.ui.require.toUrl("poccsnovsrvcldfrontend/data/docConsModel.json"));
  
            // this.getView().byId("table-odv-row-mode").setRowCount(oJSONModel.getData().data.length);
            this.getView().setModel(oJSONModel);
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
            const input1 = this.getView().byId("filtri-input-n-odv");
            const input2 = this.getView().byId("filtri-input-n-del"); 
            const inputData = this.getView().byId("filtri-date");
            const aFilters = {
                'number': input1.getSelectedItems().length > 0 ? (function () {const result = []; input1.getSelectedItems().forEach(input => result.push(input.getText())); return result;})() : ['1030067869', '1030067875', '1030067906', '1030069545'],
                'customerNumber': input2.getSelectedItems().length > 0 ? (function () {const result = []; input2.getSelectedItems().forEach(input => result.push(input.getText())); return result;})() : ['230801 EF07D0 SFUSO 15/1', '230802 EF05B SFUSO 20/2 rev1 15/2', '230803 EF07D0 SFUSO 19/3', '240208 EF05B 11/4'],
                'date1': inputData.getProperty("dateValue"),
                'date2': inputData.getProperty("secondDateValue")
            };
            const initialData = sampleData.data;
            const initialSelectedData = this.getView().getModel().getData().selectedData;
            let myDate;
            let newData = [];
            let numberFilteredData, customerNumberFilteredData, dateFilteredData;
            if (!aFilters.number == false)
                numberFilteredData = initialData.filter((row) => aFilters.number.includes(row.number));
            if (!aFilters.customerNumber == false)
                customerNumberFilteredData = initialData.filter((row) => aFilters.customerNumber.includes(row.customerNumber));
            if (!aFilters.date1 == false) {
                dateFilteredData = initialData.filter((row) => {
                    myDate = (new Date(row.date.split('/')[2]+'-'+row.date.split('/')[1]+'-'+row.date.split('/')[0])).getTime();
                    return aFilters.date1.getTime() <= myDate && myDate <= aFilters.date2.getTime();
                });
            }
            if (!numberFilteredData == false && !customerNumberFilteredData == false && !dateFilteredData == false)
                newData = numberFilteredData.filter((row) => customerNumberFilteredData.includes(row) && dateFilteredData.includes(row));
            else if (!numberFilteredData == false && !customerNumberFilteredData == false)
                newData = numberFilteredData.filter((row) => customerNumberFilteredData.includes(row));
            else if (!numberFilteredData == false && !dateFilteredData == false)
                newData = numberFilteredData.filter((row) => dateFilteredData.includes(row));
            else if (!customerNumberFilteredData == false && !dateFilteredData == false)
                newData = customerNumberFilteredData.filter((row) => dateFilteredData.includes(row));
            else if (!numberFilteredData == false)
                newData = numberFilteredData;
            else if (!customerNumberFilteredData == false)
                newData = customerNumberFilteredData;
            else if (!dateFilteredData == false)
                newData = dateFilteredData;
            else
                newData = sampleData.data;
            this.getView().getModel().setData({'data': newData, 'selectedData': initialSelectedData});
            this.getView().byId("table-odv-vbox").setVisible(true);
            this.getView().byId("table-odv-row-mode").setRowCount(newData.length || 1);
        }
    });
});
