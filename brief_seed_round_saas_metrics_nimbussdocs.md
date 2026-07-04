# Brief: Visibilidad Financiera para Ronda de Inversión

**De:** Marcela Restrepo, Co-fundadora & COO — NimbusDocs  
**Para:** Val (Analytics Engineer freelance)  
**Asunto:** Necesitamos visibilidad financiera antes de la ronda de inversión

---

Hola Val,

Gracias por aceptar ayudarnos. Te doy el contexto completo para que entiendas qué nos está doliendo.

NimbusDocs es una plataforma de gestión documental por suscripción. Llevamos 14 meses operando. Tenemos tres planes:

- **Basic:** $15 USD/mes
- **Pro:** $45 USD/mes
- **Enterprise:** $120 USD/mes

Los clientes pueden darse de alta, cancelar, o cambiar de plan (upgrade/downgrade) en cualquier momento. Cada cambio de plan genera un nuevo registro de suscripción con su propia fecha de inicio.

**El problema que tenemos:** estamos por entrar a una ronda de inversión seed, y los inversionistas nos van a preguntar cosas que hoy no podemos responder con certeza. Ahorita literalmente alguien revisa un Excel a mano cada fin de mes y "más o menos" calcula cuánto facturamos. No es confiable y nos toma días.

Las preguntas que necesito que tu sistema me responda, todas los meses, sin que nadie tenga que calcular nada a mano:

1. **¿Cuánto dinero recurrente tenemos asegurado este mes?**  
   No ventas totales — específicamente lo que se repite mes a mes, porque eso es lo que valoran los inversionistas en un SaaS.

2. **¿Estamos creciendo o decreciendo mes a mes, y por qué?**  
   Necesito separar: ¿el cambio se debe a clientes nuevos, a clientes que cancelaron, o a clientes que subieron/bajaron de plan? Hoy no tengo ni idea de cuál de las tres cosas está pasando.

3. **¿Qué porcentaje de clientes nos está abandonando cada mes?**  
   Y ojo — un cliente que cancela en enero y uno que cancela en junio no deberían contarse igual si yo quiero saber la tasa "de este mes". Necesito que sea por período, no acumulado desde el inicio de los tiempos.

4. **Si un cliente nuevo se queda con nosotros en promedio X meses, ¿cuánto dinero nos genera en total durante su vida como cliente?**  
   Esto es clave porque mi costo de adquisición (lo que gasto en marketing para conseguir un cliente) tiene que ser MENOR a esto, o estamos perdiendo dinero con cada cliente nuevo. Hoy no tengo esa cifra para defenderla frente a los inversionistas.

5. **Bonus, si te da el tiempo:** quiero saber si el Plan Enterprise tiene menos cancelaciones que el Basic. Sospecho que los clientes que pagan más se quedan más tiempo, pero es solo una corazonada — quiero el dato.

---

**Una regla de negocio importante:** si un cliente cancela y se vuelve a suscribir 2 meses después, eso NO debería contarse como "el mismo cliente que nunca se fue" — es una reactivación, y quiero poder distinguir ese patrón también si es posible (aunque esto último es deseable, no obligatorio).

¿Me puedes confirmar que entendiste el problema antes de que empieces a construir? Prefiero que me digas con tus palabras qué vas a construir para cada una de mis 5 preguntas, antes de que toques código.

Gracias,  
**Marcela**