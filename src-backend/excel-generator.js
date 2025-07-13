const ExcelJS = require('exceljs');

async function generateInventoryExcel(res, storeDetails, inventoryData, startDate, endDate) {
    try {
        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'Inventario Studio';
        workbook.created = new Date();
        const worksheet = workbook.addWorksheet('Inventario', {
            pageSetup: { paperSize: 9, orientation: 'landscape' }
        });

        // --- Encabezado del Reporte ---
        //worksheet.mergeCells('A1:P1');
        const titleCell = worksheet.getCell('A1');
        titleCell.value = `Nombre o Razón Social: ${storeDetails.name}`;
        titleCell.font = { name: 'Arial', size: 12, bold: true };
        titleCell.alignment = { vertical: 'middle', horizontal: 'left' };

        //worksheet.mergeCells('A2:P2');
        const rifCell = worksheet.getCell('A2');
        rifCell.value = `RIF: ${storeDetails.rif}`;
        rifCell.font = { name: 'Arial', size: 12, bold: true };
        rifCell.alignment = { vertical: 'middle', horizontal: 'left' };

        //worksheet.mergeCells('A3:P3');
        const reportTitleCell = worksheet.getCell('A3');
        reportTitleCell.value = 'REGISTRO DE ENTRADAS Y SALIDAS DE MERCANCIA DE LOS INVENTARIOS DE ACUERDO AL REGLAMENTO DE LA LEY DE IMPUESTO SOBRE LA RENTA ARTICULO 177';
        reportTitleCell.font = { name: 'Arial', size: 14, bold: true };
        reportTitleCell.alignment = { vertical: 'middle', horizontal: 'left' };
        
        //worksheet.mergeCells('A4:P4');
        //const legalBaseCell = worksheet.getCell('A4');
        // legalBaseCell.value = 'DE ACUERDO AL REGLAMENTO DE LA LEY DE IMPUESTO SOBRE LA RENTA ARTICULO 177';
        // legalBaseCell.font = { name: 'Arial', size: 10, bold: true };
        // legalBaseCell.alignment = { vertical: 'middle', horizontal: 'left' };
        
        const periodoCell = worksheet.getCell('A4');
        periodoCell.value = `PERIODO CORRESPONDIENTE: EL ${startDate} AL ${endDate}`;
        periodoCell.font = { name: 'Arial', size: 10, bold: true };
        periodoCell.alignment = { vertical: 'middle', horizontal: 'left' };

        worksheet.getRow(5).height = 20; // Espacio

        // --- Cabeceras de la Tabla ---
        const headerStyle = {
            font: { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } },
            alignment: { vertical: 'middle', horizontal: 'center', wrapText: true },
            fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } },
            border: {
                top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' }
            }
        };

        // worksheet.mergeCells('A6:B6');
        // worksheet.getCell('A6').value = 'ARTICULO';
        // worksheet.getCell('A6').style = headerStyle;
        // worksheet.getCell('B6').style = headerStyle; // Apply to merged cells

        worksheet.mergeCells('C6:H6');
        worksheet.getCell('C6').value = 'UNIDADES EN EXISTENCIA';
        
        worksheet.mergeCells('I6:K6');
        worksheet.getCell('I6').value = 'VALORES UNITARIOS EN BS';
                
        worksheet.mergeCells('L6:Q6');
        worksheet.getCell('L6').value = 'VALORES DE EXISTENCIAS EN BS';

        worksheet.getCell('C6').style = headerStyle;
        worksheet.getCell('D6').style = headerStyle;
        worksheet.getCell('E6').style = headerStyle;
        worksheet.getCell('F6').style = headerStyle;
        worksheet.getCell('G6').style = headerStyle;
        worksheet.getCell('H6').style = headerStyle;
        worksheet.getCell('I6').style = headerStyle;
        worksheet.getCell('J6').style = headerStyle;
        worksheet.getCell('K6').style = headerStyle;
        worksheet.getCell('L6').style = headerStyle;
        worksheet.getCell('M6').style = headerStyle;
        worksheet.getCell('N6').style = headerStyle;
        worksheet.getCell('O6').style = headerStyle;
        worksheet.getCell('P6').style = headerStyle;
        worksheet.getCell('Q6').style = headerStyle;


        // worksheet.mergeCells('C6:H6');
        // worksheet.getCell('C6').value = 'UNIDADES';
        // worksheet.getCell('C6').style = headerStyle;

        // worksheet.mergeCells('I6:K6');
        // worksheet.getCell('I6').value = 'VALORACION UNITARIA BS';
        // worksheet.getCell('I6').style = headerStyle;
        
        // worksheet.mergeCells('L6:N6');
        // worksheet.getCell('L6').value = 'VALORACION TOTAL ENTRADAS BS';
        // worksheet.getCell('L6').style = headerStyle;

        // worksheet.mergeCells('O6:P6');
        // worksheet.getCell('O6').value = 'VALORACION TOTAL SALIDAS BS';
        // worksheet.getCell('O6').style = headerStyle;

        const subHeaders = [
            'N°', 'DESCRIPCION',
            'EXISTENCIA ANTERIOR', 'ENTRADAS', 'SALIDAS', 'RETIROS', 'AUTO-CONSUMO', 'EXISTENCIA ACTUAL',
            'VALOR ANTERIOR', 'VALOR ACTUAL', 'VALOR PROMEDIO',
            'EXISTENCIA ANTERIOR', 'ENTRADAS', 'SALIDAS', 'RETIROS', 'AUTO-CONSUMO', 'EXISTENCIA ACTUAL'
        ];
        const subHeaderRow = worksheet.addRow(subHeaders);
        subHeaderRow.eachCell((cell) => { cell.style = headerStyle; });
        
        // --- Añadir Datos Dinámicos ---
        inventoryData.forEach(item => {
            const row = worksheet.addRow([
                item.code,
                item.description,
                item.existenciaAnterior,
                item.entradas,
                item.salidas,
                item.retiros,
                item.autoconsumo,
                item.existenciaActual,
                item.valorUnitarioAnterior,
                item.valorUnitarioActual,
                item.valorPromedio,
                0, // Existencia Anterior (valor) - Placeholder
                0, // Entradas (valor) - Placeholder
                0, // Salidas (valor) - Placeholder
                0, // Retiros (valor) - Placeholder
                0, // Auto-Consumo (valor) - Placeholder
                0  // Existencia Actual (valor) - Placeholder
            ]);
            
            row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
                cell.font = { name: 'Arial', size: 10 };
                cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
                if (colNumber >= 3) { // Alineación para números
                    cell.alignment = { horizontal: 'right' };
                    if (colNumber > 8 && colNumber < 12) { // Formato de moneda para valores unitarios
                        cell.numFmt = '#,##0.00';
                    }
                }
            });
        });

        // --- Totalizar ---
        const totalRow = worksheet.addRow([
            '', 'TOTALES',
            '', '', '', '', '', '', '', '', '',
            // { formula: `SUM(C7:C${worksheet.rowCount})` }, // Existencia Anterior
            // { formula: `SUM(D7:D${worksheet.rowCount})` }, // Entradas
            // { formula: `SUM(E7:E${worksheet.rowCount})` }, // Salidas
            // { formula: `SUM(F7:F${worksheet.rowCount})` }, // Retiros
            // { formula: `SUM(G7:G${worksheet.rowCount})` }, // Auto-Consumo
            // { formula: `SUM(H7:H${worksheet.rowCount})` }, // Existencia Actual
            // { formula: `SUM(I7:I${worksheet.rowCount})` }, // Valor Unitario Anterior
            // { formula: `SUM(J7:J${worksheet.rowCount})` }, // Valor Unitario Actual
            // { formula: `SUM(K7:K${worksheet.rowCount})` }, // Valor Promedio
            { formula: `SUM(L7:L${worksheet.rowCount})` }, // Existencia Anterior (valor)
            { formula: `SUM(M7:M${worksheet.rowCount})` }, // Entradas (valor)
            { formula: `SUM(N7:N${worksheet.rowCount})` }, // Salidas
            { formula: `SUM(O7:O${worksheet.rowCount})` }, // Retiros
            { formula: `SUM(P7:P${worksheet.rowCount})` }, // Auto-Consumo
            { formula: `SUM(Q7:Q${worksheet.rowCount})` }  // Existencia Actual (valor)
        ]);
        totalRow.eachCell((cell, colNumber) => {
            cell.font = { name: 'Arial', size: 10, bold: true };
            //cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
            if (colNumber >= 3) { // Alineación para números
                cell.alignment = { horizontal: 'right' };
                if (colNumber > 8 && colNumber < 12) { // Formato de moneda para valores unitarios
                    cell.numFmt = '#,##0.00';
                }
            }
        });

        // Ajustar ancho de columnas
        worksheet.columns.forEach(column => {
            // let maxLength = 0;
            // column.eachCell({ includeEmpty: true }, cell => {
            //     let columnLength = cell.value ? cell.value.toString().length : 10;
            //     if (columnLength > maxLength) {
            //         maxLength = columnLength;
            //     }
            // });
            //column.width = maxLength < 12 ? 12 : maxLength + 2;
            column.width = 12; // Ancho fijo para todas las columnas
        });
        worksheet.getColumn('B').width = 40; // Descripción más ancha

        // --- Enviar el archivo al cliente ---
        res.setHeader(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        res.setHeader(
            'Content-Disposition',
            `attachment; filename="Reporte_Inventario_${startDate}_a_${endDate}.xlsx"`
        );

        await workbook.xlsx.write(res);
        res.end();

    } catch (error) {
        console.error('Error en generateInventoryExcel:', error);
        // Si no se ha enviado una respuesta aún, enviar un error.
        if (!res.headersSent) {
            res.status(500).json({ error: 'Error interno al generar el archivo Excel.' });
        }
    }
}

module.exports = { generateInventoryExcel };
