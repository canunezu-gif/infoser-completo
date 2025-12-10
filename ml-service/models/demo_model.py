# models/demo_model.py
# Modo "sin modelo entrenado": heurística simple + misma interfaz que scikit-learn

from typing import Dict, List, Tuple

PRIORIDAD_PESO = {"baja": 0.05, "media": 0.15, "alta": 0.30}
SERVICIO_PESO = {"instalacion": 0.05, "mantenimiento": 0.10, "reparacion": 0.00, "asesoria": -0.02}
COMUNA_PESO   = {"santiago": 0.05, "providencia": 0.08, "melipilla": 0.03, "maipu": 0.04, "nunoa": 0.06}
REGION_PESO   = {"rm": 0.02}

def _clip01(x: float) -> float:
    return 0.0 if x < 0.0 else 1.0 if x > 1.0 else x

def _proba(d: Dict) -> float:
    prioridad = str(d.get("prioridad", "media")).lower()
    tipo      = str(d.get("tipo_servicio", "instalacion")).lower()
    comuna    = str(d.get("comuna", "santiago")).lower()
    region    = str(d.get("region", "rm")).lower()
    tiene_tecnico = 1 if int(d.get("tiene_tecnico", 0)) else 0
    hora_dia      = int(d.get("hora_dia", 12))
    dia_semana    = int(d.get("dia_semana", 2))

    base = 0.35
    base += PRIORIDAD_PESO.get(prioridad, 0.0)
    base += SERVICIO_PESO.get(tipo, 0.0)
    base += COMUNA_PESO.get(comuna, 0.0)
    base += REGION_PESO.get(region, 0.0)
    base += 0.10 * tiene_tecnico

    # un poco de "estacionalidad" semanal-horaria muy simple
    if dia_semana in (1,2,3):   # mar-mie
        base += 0.03
    if 9 <= hora_dia <= 16:     # horario hábil
        base += 0.05

    return _clip01(base)

class DemoModel:
    """Imita .predict_proba(X) de scikit-learn."""
    def predict_proba(self, X: List[Dict]) -> List[Tuple[float, float]]:
        out = []
        for d in X:
            p1 = _proba(d)
            out.append((1.0 - p1, p1))  # (prob_0, prob_1)
        return out

def load_model():
    """API compatible con un loader real de joblib: retorna un objeto con predict_proba."""
    return DemoModel()
