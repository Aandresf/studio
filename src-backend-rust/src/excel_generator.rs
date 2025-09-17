// src-backend-rust/src/excel_generator.rs

use rust_xlsxwriter::{Workbook, Format, XlsxError};
use serde_json::Value;

pub struct ExcelGenerator;

impl ExcelGenerator {
    pub fn generate_excel(_title: &str, _headers: &[&str], _data: &[Vec<String>]) -> Result<Vec<u8>, XlsxError> {
        let mut workbook = Workbook::new();
        let _worksheet = workbook.add_worksheet();
        let buffer = workbook.save_to_buffer()?;
        Ok(buffer)
    }

    pub fn generate_inventory_excel(data: &[Value]) -> Result<Vec<u8>, XlsxError> {
        let mut workbook = Workbook::new();
        let worksheet = workbook.add_worksheet();
        
        // Crear formato para encabezados
        let header_format = Format::new().set_bold();
        
        // Escribir encabezados
        worksheet.write_string_with_format(0, 0, "Producto", &header_format)?;
        worksheet.write_string_with_format(0, 1, "SKU", &header_format)?;
        worksheet.write_string_with_format(0, 2, "Stock", &header_format)?;
        worksheet.write_string_with_format(0, 3, "Precio Costo", &header_format)?;
        worksheet.write_string_with_format(0, 4, "Precio Venta", &header_format)?;
        worksheet.write_string_with_format(0, 5, "Valor Total", &header_format)?;
        
        // Escribir datos
        for (i, item) in data.iter().enumerate() {
            let row = i + 1; // La fila 0 es para los encabezados
            
            worksheet.write_string(row as u32, 0, item["name"].as_str().unwrap_or(""))?;
            worksheet.write_string(row as u32, 1, item["sku"].as_str().unwrap_or(""))?;
            worksheet.write_number(row as u32, 2, item["stock"].as_f64().unwrap_or(0.0))?;
            worksheet.write_number(row as u32, 3, item["cost_price"].as_f64().unwrap_or(0.0))?;
            worksheet.write_number(row as u32, 4, item["sales_price"].as_f64().unwrap_or(0.0))?;
            
            // Calcular valor total (stock * precio_costo)
            let stock = item["stock"].as_f64().unwrap_or(0.0);
            let cost = item["cost_price"].as_f64().unwrap_or(0.0);
            worksheet.write_number(row as u32, 5, stock * cost)?;
        }
        
        // Guardar workbook a un buffer
        let buffer = workbook.save_to_buffer()?;
        Ok(buffer)
    }
}