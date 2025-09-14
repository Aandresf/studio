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

        const subHeaders = [
            'N°', 'DESCRIPCION',
            'EXISTENCIA ANTERIOR', 'ENTRADAS', 'SALIDAS', 'RETIROS', 'AUTO-CONSUMO', 'EXISTENCIA ACTUAL',
            'VALOR ANTERIOR', 'VALOR ACTUAL', 'VALOR PROMEDIO',
            'EXISTENCIA ANTERIOR', 'ENTRADAS', 'SALIDAS', 'RETIROS', 'AUTO-CONSUMO', 'EXISTENCIA ACTUAL'
        ];
        const subHeaderRow = worksheet.addRow(subHeaders);
        subHeaderRow.eachCell((cell) => { cell.style = headerStyle; });
        
        // --- Añadir Datos Dinámicos ---
        inventoryData.forEach((item, index) => {
            const row = worksheet.addRow([
                index + 1, // N°
                item.description,
                item.existenciaAnterior,
                item.entradas,
                item.salidas,
                item.retiros,
                item.autoconsumo,
                item.existenciaActual,
                item.valorUnitarioAnterior,
                item.valorUnitarioActual,
                item.valorPromedio, // Este campo no se calcula, se puede dejar o quitar
                item.valorExistenciaAnterior,
                item.valorEntradas,
                item.valorSalidas,
                item.valorRetiros,
                item.valorAutoconsumo,
                item.valorExistenciaActual
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
            { formula: `SUM(L7:L${worksheet.rowCount})` }, // Existencia Anterior (valor)
            { formula: `SUM(M7:M${worksheet.rowCount})` }, // Entradas (valor)
            { formula: `SUM(N7:N${worksheet.rowCount})` }, // Salidas
            { formula: `SUM(O7:O${worksheet.rowCount})` }, // Retiros
            { formula: `SUM(P7:P${worksheet.rowCount})` }, // Auto-Consumo
            { formula: `SUM(Q7:Q${worksheet.rowCount})` }  // Existencia Actual (valor)
        ]);
        totalRow.eachCell((cell, colNumber) => {
            cell.font = { name: 'Arial', size: 10, bold: true };
            if (colNumber >= 3) { // Alineación para números
                cell.alignment = { horizontal: 'right' };
                if (colNumber > 8 && colNumber < 12) { // Formato de moneda para valores unitarios
                    cell.numFmt = '#,##0.00';
                }
            }
        });

        // Ajustar ancho de columnas
        worksheet.columns.forEach(column => {
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

async function generateInventoryAsOfExcel(res, storeDetails, inventoryData, asOfDate) {
    try {
        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'Inventario Studio';
        workbook.created = new Date();
        const worksheet = workbook.addWorksheet('Inventario-AsOf', { pageSetup: { paperSize: 9, orientation: 'portrait' } });

        worksheet.getCell('A1').value = `Nombre o Razón Social: ${storeDetails.name}`;
        worksheet.getCell('A2').value = `RIF: ${storeDetails.rif}`;
        worksheet.getCell('A3').value = `INVENTARIO AL: ${asOfDate}`;

        const headers = ['N°', 'Código', 'Descripción', 'Existencia', 'Valor Unitario', 'Valor Existencia'];
        worksheet.addRow([]);
        const headerRow = worksheet.addRow(headers);
        headerRow.eachCell((cell) => {
            cell.font = { name: 'Arial', size: 10, bold: true };
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } };
            cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
            cell.font = { color: { argb: 'FFFFFFFF' }, bold: true, name: 'Arial', size: 10 };
        });

        inventoryData.forEach((item, idx) => {
            const existencia = item.existenciaActual != null ? item.existenciaActual : (item.existencia || 0);
            const valorUnit = item.valorUnitarioActual != null ? item.valorUnitarioActual : (item.valorUnitario || 0);
            const valorExist = item.valorExistenciaActual != null ? item.valorExistenciaActual : (existencia * valorUnit);
            const row = worksheet.addRow([idx + 1, item.code || '', item.description || '', existencia, valorUnit, valorExist]);
            row.eachCell((cell, colNumber) => {
                cell.font = { name: 'Arial', size: 10 };
                cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
                if (colNumber >= 4) { cell.alignment = { horizontal: 'right' }; }
                if (colNumber >= 5) { cell.numFmt = '#,##0.00'; }
            });
        });

        // Totales
        const totalRow = worksheet.addRow(['', 'TOTALES', '', { formula: `SUM(D${headerRow.number + 1}:D${worksheet.rowCount})` }, { formula: `SUM(E${headerRow.number + 1}:E${worksheet.rowCount})` }, { formula: `SUM(F${headerRow.number + 1}:F${worksheet.rowCount})` }]);
        totalRow.eachCell((cell, colNumber) => {
            cell.font = { name: 'Arial', size: 10, bold: true };
            if (colNumber >= 4) { cell.alignment = { horizontal: 'right' }; if (colNumber >= 5) cell.numFmt = '#,##0.00'; }
        });

        // Column widths
        worksheet.getColumn(1).width = 6;
        worksheet.getColumn(2).width = 14;
        worksheet.getColumn(3).width = 40;
        worksheet.getColumn(4).width = 12;
        worksheet.getColumn(5).width = 16;
        worksheet.getColumn(6).width = 18;

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="Inventario_AsOf_${asOfDate}.xlsx"`);
        await workbook.xlsx.write(res);
        res.end();
    } catch (err) {
        console.error('Error generateInventoryAsOfExcel:', err);
        if (!res.headersSent) res.status(500).json({ error: 'Error interno al generar el archivo Excel.' });
    }
}

module.exports.generateInventoryAsOfExcel = generateInventoryAsOfExcel;

async function generateMovementsExcel(res, storeDetails, movements, startDate, endDate, title = 'Movimientos') {
    try {
        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'Inventario Studio';
        workbook.created = new Date();
        const worksheet = workbook.addWorksheet(title, { pageSetup: { paperSize: 9, orientation: 'landscape' } });

        worksheet.getCell('A1').value = `Nombre o Razón Social: ${storeDetails.name}`;
        worksheet.getCell('A2').value = `RIF: ${storeDetails.rif}`;
        worksheet.getCell('A3').value = `${title} - PERIODO: ${startDate} a ${endDate}`;

        // Determine columns based on preview spec logic
        // If movements are aggregated by client/supplier they will contain keys like client_name/qty/amount or entity_name/total_cost
        const sample = movements && movements.length ? movements[0] : null;
        const cols = [];
        // Always index
        cols.push({ key: '__idx', label: 'N°' });
        // Determine scenario: client-group, summary, detailed
        if (sample && ('client_name' in sample || 'entity_name' in sample) && ('qty' in sample || 'total_qty' in sample)) {
            // Aggregated by entity
            if ('client_name' in sample) {
                cols.push({ key: 'client_document', label: 'Documento' });
                cols.push({ key: 'client_name', label: 'Cliente' });
                cols.push({ key: 'qty', label: 'Cantidad', fmt: 'qty' });
                cols.push({ key: 'amount', label: 'Monto', fmt: 'currency' });
            } else {
                cols.push({ key: 'entity_document', label: 'Documento' });
                cols.push({ key: 'entity_name', label: 'Entidad' });
                cols.push({ key: 'qty', label: 'Cantidad', fmt: 'qty' });
                cols.push({ key: 'total_cost', label: 'Total Costo', fmt: 'currency' });
            }
        } else if (sample && ('total_qty' in sample && 'total_amount' in sample)) {
            // summary rows
            cols.push({ key: 'date', label: 'Fecha' });
            cols.push({ key: 'document_number', label: 'Nº Factura' });
            cols.push({ key: 'entity_name', label: 'Cliente/Proveedor' });
            cols.push({ key: 'total_qty', label: 'Cantidad', fmt: 'qty' });
            cols.push({ key: 'total_amount', label: 'Monto', fmt: 'currency' });
        } else {
            // detailed
            cols.push({ key: 'transaction_date', label: 'Fecha/Hora' });
            cols.push({ key: 'product_name', label: 'Producto' });
            cols.push({ key: 'variant_sku', label: 'Variante' });
            cols.push({ key: 'quantity', label: 'Cantidad', fmt: 'qty' });
            // price/cost
            if ('price' in sample) cols.push({ key: 'price', label: 'Precio Unit.', fmt: 'currency' });
            if ('unit_cost' in sample) cols.push({ key: 'unit_cost', label: 'Costo Unit.', fmt: 'currency' });
            cols.push({ key: '__total_price', label: 'Total Precio', fmt: 'currency' });
            cols.push({ key: '__total_cost', label: 'Total Costo', fmt: 'currency' });
            cols.push({ key: 'entity_name', label: 'Entidad' });
            cols.push({ key: 'entity_document', label: 'Documento' });
            cols.push({ key: 'document_number', label: 'Nº Factura' });
        }

        // write headers
        const headerRow = cols.map(c => c.label);
        worksheet.addRow(headerRow);

        // add rows
        movements.forEach((m, idx) => {
            const row = [];
            for (const c of cols) {
                if (c.key === '__idx') row.push(idx + 1);
                else if (c.key === '__total_price') row.push((m.price || 0) * (m.quantity || 0));
                else if (c.key === '__total_cost') row.push((m.unit_cost || 0) * (m.quantity || 0));
                else row.push(m[c.key] != null ? m[c.key] : '');
            }
            worksheet.addRow(row);
        });

        // format columns: widths and number formats
        worksheet.columns.forEach((col, i) => {
            // fecha-like columns
            const header = cols[i] && cols[i].label ? cols[i].label.toLowerCase() : '';
            if (header.includes('fecha')) col.width = 20;
            if (header.includes('producto') || header.includes('entidad') || header.includes('cliente') || header.includes('proveedor')) col.width = 30;
            // currency/qty formats
            const fmt = cols[i] && cols[i].fmt ? cols[i].fmt : null;
            if (fmt === 'currency') col.numFmt = '#,##0.00';
            if (fmt === 'qty') col.numFmt = '#,##0';
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${title.replace(/\s+/g, '_')}_${startDate}_a_${endDate}.xlsx"`);
        await workbook.xlsx.write(res);
        res.end();
    } catch (err) {
        console.error('Error generateMovementsExcel:', err);
        if (!res.headersSent) res.status(500).json({ error: 'Error interno al generar el archivo Excel.' });
    }
}

module.exports.generateMovementsExcel = generateMovementsExcel;
