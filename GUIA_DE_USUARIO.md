# Guía de Usuario — Talento360-HR

Esta guía explica, paso a paso, cómo usar el sistema Talento360-HR desde la interfaz web. Está pensada para las personas que usarán el sistema día a día (RRHH, supervisores y empleados), no para desarrolladores.

---

## 1. Roles del sistema

Cada cuenta tiene uno de estos tres roles, y lo que se puede ver y hacer depende de cuál le fue asignado:

| Rol | Puede acceder a |
|---|---|
| **Administrador RRHH** (`ADMIN_RRHH`) | Todo el sistema, incluyendo gestión de usuarios |
| **Supervisor** (`SUPERVISOR`) | Todos los módulos de gestión (Empleados, Reclutamiento, Desempeño, Asistencia, Nómina, Capacitación), excepto Usuarios |
| **Empleado** (`EMPLEADO`) | Únicamente su propio espacio de autoservicio ("Mi espacio") |

El rol de cada cuenta se ve como una etiqueta junto al correo, en la parte inferior del menú lateral.

---

## 2. Iniciar sesión

1. Abra la aplicación web (por defecto `http://localhost:5173` en un entorno local).
2. Ingrese su **correo electrónico** y **contraseña** en la pantalla de inicio de sesión.
3. Al iniciar sesión correctamente, será dirigido al panel principal (**Inicio**).

No existe registro público: las cuentas las crea únicamente un Administrador RRHH desde el módulo **Usuarios** (ver sección 4).

### 2.1 Olvidé mi contraseña

1. En la pantalla de login, haga clic en **"¿Olvidaste tu contraseña?"**.
2. Escriba su correo y envíe el formulario. Por seguridad, el sistema siempre muestra el mismo mensaje ("Revisa tu correo"), exista o no una cuenta con ese correo.
3. Si el sistema tiene configurado un correo de envío (SMTP), recibirá un enlace de recuperación por email, válido por un tiempo limitado.
   > **En un entorno de desarrollo sin SMTP configurado**, el correo no se envía de verdad: el enlace se imprime en la consola/terminal donde corre el backend. Si está probando el sistema localmente y no le llega el correo, pida a la persona que administra el servidor que revise esa consola.
4. Abra el enlace recibido, ingrese la nueva contraseña (mínimo 8 caracteres) y confírmela.

> **Nota:** actualmente no existe una opción para cambiar la contraseña estando ya dentro del sistema (con sesión iniciada). Si desea cambiarla, use el flujo de "olvidé mi contraseña" descrito arriba.

---

## 3. Navegación general

El menú lateral izquierdo muestra las secciones disponibles según su rol:

- **Inicio** — panel principal, visible para todos.
- **Mi espacio** — su portal de autoservicio personal, visible para todos.
- **Empleados** — Expediente Digital (Administrador RRHH y Supervisor).
- **Reclutamiento** — proceso de selección (Administrador RRHH y Supervisor).
- **Desempeño** — objetivos y evaluaciones (Administrador RRHH y Supervisor).
- **Usuarios** — gestión de cuentas de acceso (solo Administrador RRHH).
- Grupo **Módulos HRM**:
  - **Asistencia y Tiempo**
  - **Nómina**
  - **Capacitación (LMS)**
  
  (Administrador RRHH y Supervisor)

Si intenta acceder a una sección para la que no tiene permiso (por ejemplo, escribiendo la dirección directamente), el sistema lo redirige automáticamente al Inicio.

---

## 4. Usuarios (solo Administrador RRHH)

Aquí se gestionan las cuentas de acceso al sistema (no confundir con los expedientes de empleados, que es otro módulo).

**Ver usuarios:** la tabla muestra correo, rol, estado (Activo/Inactivo) y fecha de creación.

**Crear un usuario nuevo:**
1. Haga clic en **"Nuevo usuario"**.
2. Complete: Correo electrónico, Contraseña (mínimo 8 caracteres) y Rol (Admin RRHH / Supervisor / Empleado).
3. Guarde. La persona ya puede iniciar sesión con esas credenciales.

**Gestionar un usuario existente**, desde el menú de acciones de cada fila:
- **Cambiar rol** — seleccione el nuevo rol de la lista.
- **Desactivar** — bloquea el acceso de esa cuenta (pide confirmación). No puede desactivar su propia cuenta.
- **Reactivar** — restaura el acceso a una cuenta desactivada.

> No existe una opción para eliminar usuarios ni para resetear su contraseña desde aquí; para eso, la persona debe usar "¿Olvidaste tu contraseña?" en el login.

> Crear un usuario con rol Empleado no lo vincula automáticamente con un expediente en el módulo Empleados — ese paso se hace desde Empleados (ver sección 5).

---

## 5. Empleados (Expediente Digital)

*Administrador RRHH y Supervisor.*

Este módulo centraliza los datos de cada colaborador de la empresa.

**Buscar y filtrar:** use la caja de búsqueda por nombre, y los filtros de Estado (Activo/Inactivo) y Departamento.

**Registrar un nuevo empleado:**
1. Haga clic en **"Registrar empleado"**.
2. Complete: Nombres, Apellidos, Cédula/DNI, Fecha de nacimiento, Fecha de ingreso, Teléfono, Dirección.
3. Seleccione Sucursal, Departamento y Puesto. Si el que necesita no existe todavía, use el enlace **"+"** dentro de cada lista desplegable para crearlo al vuelo (un Puesto requiere título, salario base y departamento).
4. Si es Administrador RRHH, opcionalmente puede vincular una **cuenta de usuario** en el campo "Cuenta de usuario vinculada (opcional)" — ver la nota más abajo.
5. Guarde. El empleado queda con estado **Activo**.

**Ver el expediente completo:** haga clic en **"Ver expediente"** en la fila del empleado. Se abre un panel con:

- **Datos generales**: cédula, departamento, puesto, sucursal, antigüedad calculada automáticamente en años, y el estado de la **cuenta de Autoservicio** vinculada (el correo, o "Sin vincular" en rojo si no tiene ninguna).
- **Contratos**: registre uno nuevo indicando Tipo (Indefinido, Temporal, Por horas, Práctica), fecha de inicio, fecha de fin (opcional) y salario. El contrato vigente se marca con una etiqueta "Vigente".
- **Documentos**: suba archivos clasificados por tipo (Cédula/DNI, Currículum, Contrato, Certificado, Título académico, Otro). Cada documento subido se puede descargar con un clic.
- **Datos legales**: número de seguridad social, beneficiarios e información de contacto de emergencia.

**Editar o dar de baja:** desde las acciones de la fila puede **Editar** los datos del empleado, o **Marcar inactivo** / **Reactivar** su estado.

**Vincular la cuenta de acceso (Usuario ↔ Empleado):** para que un empleado pueda usar el portal de autoservicio ("Mi espacio"), su expediente debe estar enlazado a una cuenta de Usuario con rol Empleado. Solo un **Administrador RRHH** ve y puede cambiar este campo, tanto al registrar como al editar un empleado:

1. Primero, cree la cuenta de acceso en **Usuarios** con rol "Empleado" (ver sección 4), si aún no existe.
2. En **Empleados**, abra "Nuevo empleado" o "Editar" sobre el empleado correspondiente.
3. En el campo **"Cuenta de usuario vinculada"**, seleccione la cuenta por su correo (solo se listan cuentas activas con rol Empleado). Elija "Sin vincular" para desvincularla.
4. Guarde. A partir de ese momento, esa persona verá su información real al entrar a "Mi espacio".

> Una misma cuenta de usuario solo puede vincularse a un expediente a la vez — si intenta reutilizar una cuenta ya vinculada a otro empleado, el sistema lo rechaza con el mensaje "Ese usuario ya está vinculado a otro empleado".

---

## 6. Reclutamiento (ATS)

*Administrador RRHH y Supervisor.*

Gestiona el proceso completo, desde publicar una vacante hasta contratar al candidato.

**Publicar una vacante:**
1. **"Crear vacante"**: complete Título, Descripción, Departamento, Sucursal y Número de posiciones. Queda en estado **Borrador**.
2. Haga clic en **"Publicar"** para que la vacante pase a estado **Publicada**.
   > Mientras una vacante esté en Borrador, no se pueden recibir postulaciones — debe publicarla primero.
3. Cuando ya no necesite recibir más candidatos, use **"Cerrar"**.

**Recibir y gestionar candidatos:** al abrir una vacante publicada, verá el panel de **Postulaciones**:
- Para postular a alguien ya registrado, selecciónelo de la lista (los que ya se postularon no aparecen de nuevo).
- Para un candidato nuevo, use **"+ Registrar candidato nuevo"**: Nombres, Apellidos, Email, Teléfono y su CV (archivo). Esto lo registra y lo postula en un solo paso.

**Avanzar el proceso:** cada postulación pasa por las etapas **Recibida → En filtro → Entrevista → Oferta**, hasta un estado final de **Contratado** o **Rechazada**. Desde la tarjeta de cada postulación puede:
- **Rechazar** (puede indicar el motivo).
- **Agendar entrevista**: fecha y hora, modalidad (Presencial, Virtual, Telefónica) y comentarios.
- **Contratar candidato** (disponible cuando la postulación está en Oferta): complete Cédula/DNI, Fecha de nacimiento, Fecha de ingreso, Puesto, Tipo de contrato y Salario.

> Al contratar, el sistema crea automáticamente el **Empleado** y su primer **Contrato** en el módulo de Expediente Digital — no necesita registrarlo de nuevo ahí.

---

## 7. Desempeño y KPIs

*Administrador RRHH y Supervisor.*

1. **Ciclos de evaluación**: cree uno con Nombre, Fecha de inicio y Fecha de fin. Sirven como el período contra el que se miden objetivos y evaluaciones.
2. Seleccione un **empleado** de la lista — todo lo demás en esta pantalla se filtra según el empleado elegido.
3. **Objetivos**: cree uno indicando el Ciclo, una Descripción y la Meta a alcanzar (valor numérico). Para actualizar el avance, ingrese el "valor actual" — el porcentaje de progreso se calcula automáticamente.
4. **Evaluaciones**: registre una evaluación con Ciclo, Calificación final (0 a 100), Comentarios y un Plan de mejora si aplica. Las calificaciones de 70 o más se muestran en verde; por debajo, en rojo.

---

## 8. Asistencia y Tiempo

*Administrador RRHH y Supervisor.*

> **Importante:** el marcaje de entrada/salida en este sistema **lo realiza RRHH o el supervisor por el empleado**, no es autoservicio. El empleado no marca su propia asistencia desde "Mi espacio".

**Marcar asistencia:**
1. Seleccione al empleado en la lista.
2. Haga clic en **"Marcar entrada"** al inicio de la jornada, y **"Marcar salida"** al finalizar.
3. Al marcar la salida, el sistema calcula automáticamente las horas trabajadas y las horas extra (más de 8 horas en el día se contabilizan como extra).

**Resumen mensual:** elija un empleado y un mes para ver el total de días registrados, horas trabajadas y horas extra.

**Aprobar solicitudes de permiso/vacaciones:** en la parte superior aparece un aviso con la cantidad de **solicitudes pendientes**. Desde ahí puede **Aprobar** o **Rechazar** cada una (al rechazar, puede indicar el motivo).

**Registrar una solicitud a nombre de un empleado:** Tipo (Vacaciones, Enfermedad, Personal, Luto, Maternidad/Paternidad, Otro), fecha de inicio, fecha de fin y motivo opcional. Queda en estado **Pendiente** hasta que se apruebe o rechace.

> Los propios empleados también pueden crear sus solicitudes de permiso/vacaciones desde "Mi espacio" (ver sección 10); en ambos casos, la aprobación se hace siempre desde este módulo.

---

## 9. Nómina (Payroll)

*Administrador RRHH y Supervisor.*

El flujo de nómina sigue tres pasos obligatorios, en orden: **Crear periodo → Procesar → Cerrar**.

1. **Crear un periodo de nómina**: indique fecha de inicio y fecha de fin. Queda en estado **Abierto**.
2. **Procesar** el periodo (botón disponible solo mientras está Abierto): el sistema genera automáticamente una nómina para cada empleado **activo** que tenga un **contrato vigente** dentro de esas fechas.
   - Las horas extra se toman automáticamente de los registros de Asistencia en ese rango de fechas.
   - El cálculo varía según el tipo de contrato: Indefinido y Temporal incluyen salario + horas extra (recargo 1.35x) y deducciones de ley (SFS/AFP); Por horas se paga estrictamente según las horas extra registradas; Práctica recibe un monto fijo sin deducciones.
   - Un mensaje confirma cuántas nóminas se generaron.
   - Los empleados activos que **no** tengan un contrato vigente en ese periodo simplemente no reciben nómina — revíselo si a alguien le falta.
3. **Cerrar** el periodo (disponible solo después de Procesar): bloquea el periodo definitivamente. Un periodo cerrado no se puede volver a procesar.

**Consultar nóminas:** por cada empleado puede ver el detalle de su nómina (salario base, horas extra, deducciones, bonificaciones) y descargar el **volante de pago en PDF**.

---

## 10. Capacitación (LMS)

*Administrador RRHH y Supervisor.*

1. **Crear un curso**: Nombre, Descripción, Duración (horas), y si es obligatorio (casilla).
2. **Inscribir empleados**: seleccione el curso y el empleado a inscribir.
3. **Actualizar el progreso** de una inscripción ingresando un porcentaje (0-100).
4. Al llegar al **100%**, el sistema marca automáticamente la inscripción como **Completado** y genera un **certificado en PDF**, disponible para descargar desde ese momento. Mientras el progreso sea menor a 100%, solo se puede seguir actualizando el avance.

---

## 11. Mi espacio (Autoservicio / ESS)

Disponible para **todos los roles**, pero cada quien ve únicamente su propia información.

Al entrar, si su usuario está correctamente vinculado a un expediente de empleado, encontrará:

- **Mi perfil**: sus datos básicos.
- **Mis volantes de pago**: descargue sus propios recibos de nómina en PDF (solo puede ver los suyos).
- **Vacaciones y permisos**: consulte su saldo disponible y use **"Solicitar"** para pedir vacaciones o un permiso (mismos tipos que en la sección 8). La aprobación la realiza RRHH/Supervisor desde el módulo de Asistencia — aquí solo puede solicitar y ver el estado.
- **Mis cursos**: vea su progreso en las capacitaciones en las que está inscrito (solo lectura).
- **Mis evaluaciones**: consulte sus evaluaciones de desempeño registradas (solo lectura).

Si ve el mensaje *"Tu cuenta de usuario no está vinculada a un expediente de empleado"*, contacte a Recursos Humanos para que completen esa vinculación desde Empleados (ver sección 5).

---

## 12. Preguntas frecuentes

**¿Cómo creo la primera cuenta de administrador?**
Se crea desde el servidor (no desde la interfaz web) ejecutando el script de inicialización del sistema. Pregunte a la persona encargada de la instalación si aún no tiene credenciales.

**¿Por qué no me llega el correo de recuperación de contraseña?**
En entornos de prueba/desarrollo, el envío de correo puede no estar configurado; en ese caso el enlace no se envía por email sino que queda registrado en el servidor. Consulte con soporte técnico.

**Soy Empleado y no veo nada en "Mi espacio".**
Su cuenta necesita estar vinculada a un expediente de empleado por un Administrador RRHH desde el módulo Empleados (sección 5). Solicítelo a RRHH.

**Procesé un periodo de nómina y a un empleado le falta su recibo.**
Revise que ese empleado tenga un contrato marcado como **vigente** que cubra las fechas del periodo — solo así se incluye en el procesamiento.
