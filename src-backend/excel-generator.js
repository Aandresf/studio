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
        worksheet.mergeCells('A1:P1');
        const titleCell = worksheet.getCell('A1');
        titleCell.value = `Nombre o Razón Social: ${storeDetails.name}`;
        titleCell.font = { name: 'Arial', size: 12, bold: true };
        titleCell.alignment = { vertical: 'middle', horizontal: 'left' };

        worksheet.mergeCells('A2:P2');
        const rifCell = worksheet.getCell('A2');
        rifCell.value = `RIF: ${storeDetails.rif}`;
        rifCell.font = { name: 'Arial', size: 12, bold: true };
        rifCell.alignment = { vertical: 'middle', horizontal: 'left' };

        worksheet.mergeCells('A3:P3');
        const reportTitleCell = worksheet.getCell('A3');
        reportTitleCell.value = 'Registro de Entradas y Salidas de Mercancía de los Inventarios';
        reportTitleCell.font = { name: 'Arial', size: 14, bold: true };
        reportTitleCell.alignment = { vertical: 'middle', horizontal: 'center' };
        
        worksheet.mergeCells('A4:P4');
        const legalBaseCell = worksheet.getCell('A4');
        legalBaseCell.value = 'DE ACUERDO AL REGLAMENTO DE LA LEY DE IMPUESTO SOBRE LA RENTA ARTICULO 177';
        legalBaseCell.font = { name: 'Arial', size: 10, bold: true };
        legalBaseCell.alignment = { vertical: 'middle', horizontal: 'center' };

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

        worksheet.mergeCells('A6:B6');
        worksheet.getCell('A6').value = 'ARTICULO';
        worksheet.getCell('A6').style = headerStyle;
        worksheet.getCell('B6').style = headerStyle; // Apply to merged cells

        worksheet.mergeCells('C6:H6');
        worksheet.getCell('C6').value = 'UNIDADES';
        worksheet.getCell('C6').style = headerStyle;

        worksheet.mergeCells('I6:K6');
        worksheet.getCell('I6').value = 'VALORACION UNITARIA BS';
        worksheet.getCell('I6').style = headerStyle;
        
        worksheet.mergeCells('L6:N6');
        worksheet.getCell('L6').value = 'VALORACION TOTAL ENTRADAS BS';
        worksheet.getCell('L6').style = headerStyle;

        worksheet.mergeCells('O6:P6');
        worksheet.getCell('O6').value = 'VALORACION TOTAL SALIDAS BS';
        worksheet.getCell('O6').style = headerStyle;

        const subHeaders = [
            'CODIGO', 'DESCRIPCION', 'EXISTENCIA ANTERIOR', 'ENTRADAS', 'SALIDAS', 'RETIROS', 'AUTO-CONSUMO', 'EXISTENCIA ACTUAL',
            'VALOR UNITARIO ANTERIOR EN BS', 'VALOR UNITARIO ACTUAL EN BS', 'VALOR PROMEDIO UNITARIO EN BS',
            'COMPRAS', 'DEVOLUCIONES', 'TOTAL ENTRADAS', 'VENTAS', 'DEVOLUCIONES'
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
                0, // Compras (valor) - Placeholder
                0, // Devoluciones (valor) - Placeholder
                0, // Total Entradas (valor) - Placeholder
                0, // Ventas (valor) - Placeholder
                0  // Devoluciones (valor) - Placeholder
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

        // Ajustar ancho de columnas
        worksheet.columns.forEach(column => {
            let maxLength = 0;
            column.eachCell({ includeEmpty: true }, cell => {
                let columnLength = cell.value ? cell.value.toString().length : 10;
                if (columnLength > maxLength) {
                    maxLength = columnLength;
                }
            });
            column.width = maxLength < 12 ? 12 : maxLength + 2;
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
