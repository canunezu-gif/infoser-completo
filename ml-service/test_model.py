import datetime as dt
from main import forecast, ForecastRequest, HistoryItem
from pydantic import ValidationError

def test_forecast():
    # Crear datos sintéticos con patrón semanal claro
    # Supongamos que los lunes (weekday 0) siempre hay 10 solicitudes, y el resto 0.
    history = []
    base_date = dt.date(2023, 1, 1) # Domingo
    
    # Generar 4 semanas de datos
    for i in range(28):
        d = base_date + dt.timedelta(days=i)
        count = 10.0 if d.weekday() == 0 else 0.0 # Lunes = 10, otros = 0
        history.append(HistoryItem(date=d, comuna="test", tipo_servicio="test", count=count))
        
    req = ForecastRequest(horizon_days=7, history=history)
    
    try:
        res = forecast(req)
        print("Forecast ejecutado exitosamente.")
        
        # Verificar tipos
        print(f"Tipo de retorno en daily_forecast total: {type(res.daily_forecast[0]['total'])}")
        print(f"Tipo de retorno en pair_forecast next_days: {type(res.pair_forecast[0].next_days[0])}")
        
        # Verificar valores
        # El horizonte empieza el día después del último dato (que fue sábado 28 ene -> domingo 29 ene)
        # Domingo 29 (wd 6) -> debería ser 0
        # Lunes 30 (wd 0) -> debería ser 10
        # ...
        
        expected = [0, 10, 0, 0, 0, 0, 0] # Dom, Lun, Mar, Mie, Jue, Vie, Sab
        actual = res.pair_forecast[0].next_days
        
        print(f"Esperado: {expected}")
        print(f"Obtenido: {actual}")
        
        if actual == expected:
            print("PRUEBA EXITOSA: El patrón semanal se detectó correctamente.")
        else:
            print("PRUEBA FALLIDA: Los valores no coinciden.")
            
        # Verificar que sean enteros
        if isinstance(res.daily_forecast[0]['total'], int) and isinstance(res.pair_forecast[0].next_days[0], int):
             print("PRUEBA EXITOSA: Los valores son enteros.")
        else:
             print("PRUEBA FALLIDA: Los valores NO son enteros.")

    except Exception as e:
        print(f"Error durante la prueba: {e}")

if __name__ == "__main__":
    test_forecast()
