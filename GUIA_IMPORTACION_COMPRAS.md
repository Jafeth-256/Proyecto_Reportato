# Guía de Importación de Compras

## Descripción
Esta guía te ayudará a importar compras desde un archivo Excel al módulo de Gestión de Compras.

## Formato del Archivo Excel

### Nombre de la Hoja
La hoja debe llamarse exactamente: **`compras`**

### Columnas Requeridas
El archivo Excel debe tener las siguientes columnas en este orden:

| Columna | Tipo | Descripción | Ejemplo |
|---------|------|-------------|---------|
| `proveedor` | Número | ID del proveedor | 1 |
| `producto` | Número | ID del producto | 2 |
| `fecha` | Fecha (YYYY-MM-DD) | Fecha de la compra | 2024-12-01 |
| `precio` | Número (decimal) | Precio unitario | 500.00 |
| `cantidad` | Número (entero) | Cantidad comprada | 10 |
| `total` | Número (decimal) | Total de la compra (precio × cantidad) | 5000.00 |

## Pasos para Importar

1. **Preparar el archivo Excel**
   - Abre tu aplicación de hojas de cálculo (Excel, Google Sheets, LibreOffice Calc, etc.)
   - Crea una nueva hoja con el nombre exacto `compras`
   - Llena los datos siguiendo el formato especificado arriba
   - Guarda el archivo con extensión `.xlsx` o `.xls`

2. **Acceder al módulo de Compras**
   - Ve a la sección "Gestión de Compras" en el menú
   - Verás un botón azul "Importar Excel" en la esquina superior derecha

3. **Seleccionar el archivo**
   - Haz clic en el botón "Importar Excel"
   - Selecciona tu archivo Excel desde tu computadora
   - El sistema te mostrará una vista previa de los datos

4. **Revisar la vista previa**
   - Verifica que los datos se vean correctamente
   - El sistema mostrará los primeros 10 registros
   - Si hay más registros, verás un mensaje indicando cuántos hay

5. **Confirmar la importación**
   - Haz clic en el botón "Confirmar Importación"
   - El sistema procesará todas las compras
   - Se actualizará el inventario automáticamente para cada compra
   - Recibirás un mensaje con el número de compras importadas exitosamente

## Validaciones

- Todos los IDs de proveedor y producto deben existir en el sistema
- Las fechas deben estar en formato YYYY-MM-DD
- Los precios y cantidades deben ser números válidos
- Si hay errores, puedes intentar nuevamente con datos corregidos

## Archivo de Ejemplo

Se proporciona un archivo llamado **`EJEMPLO_COMPRAS.xlsx`** en el directorio raíz del proyecto. Puedes usarlo como referencia para entender el formato correcto.

### Datos de ejemplo:
```
Proveedor ID | Producto ID | Fecha      | Precio | Cantidad | Total
1            | 1           | 2024-12-01 | 500.00 | 10       | 5000.00
2            | 2           | 2024-12-02 | 1200.00| 5        | 6000.00
1            | 3           | 2024-12-03 | 800.00 | 8        | 6400.00
3            | 4           | 2024-12-04 | 450.00 | 15       | 6750.00
2            | 5           | 2024-12-05 | 350.00 | 20       | 7000.00
1            | 6           | 2024-12-06 | 600.00 | 12       | 7200.00
3            | 1           | 2024-12-07 | 550.00 | 14       | 7700.00
2            | 3           | 2024-12-08 | 900.00 | 9        | 8100.00
```

## Notas Importantes

✅ **Automatización del inventario**: Cuando importas compras, el sistema actualiza automáticamente el inventario, sumando las cantidades importadas al stock existente.

✅ **Usuario registrado**: Las compras se asocian automáticamente al usuario que realiza la importación.

✅ **Sin duplicados**: Si intentas importar la misma compra dos veces, se crearán registros duplicados. Verifica tus datos antes de importar.

❌ **No se pueden modificar datos después de importar**: Si necesitas cambiar datos de una compra importada, deberás editarla manualmente desde el formulario.

## Solución de Problemas

### Error: "No se encontró la hoja 'compras'"
- Verifica que la hoja en tu Excel se llame exactamente `compras` (minúsculas)
- No puede tener espacios ni caracteres especiales

### Error: "El archivo no contiene datos"
- Verifica que hayas agregado datos en las filas
- Los encabezados deben estar en la primera fila

### Las compras no se importan
- Verifica que los IDs de proveedor y producto existan en el sistema
- Revisa que las fechas estén en formato correcto (YYYY-MM-DD)
- Asegúrate de que los números sean válidos (sin letras o símbolos especiales)

## Contacto/Soporte

Si encuentras problemas adicionales, verifica:
- Que el archivo esté en formato Excel (.xlsx o .xls)
- Que tengas los permisos necesarios para importar compras
- Que el navegador permita cargas de archivos
