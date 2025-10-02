import {
  collection,
  getDocs,
  updateDoc,
  doc,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { SharedCalendarFirestore, CalendarUser } from '@/types/calendar';

/**
 * Script de migración para arreglar calendarios profesionales
 * que no tienen el miembro del profesional configurado correctamente
 */
export async function fixProfessionalCalendars() {
  try {
    console.group('🔧 Iniciando arreglo de calendarios profesionales');
    
    // Obtener todos los calendarios
    const calendarsRef = collection(db, 'shared_calendars');
    const calendarsSnapshot = await getDocs(calendarsRef);
    
    console.log(`📊 Total calendarios encontrados: ${calendarsSnapshot.size}`);
    
    let fixed = 0;
    let skipped = 0;
    let errors = 0;
    
    for (const calendarDoc of calendarsSnapshot.docs) {
      const calendar = calendarDoc.data() as SharedCalendarFirestore;
      
      // Solo procesar calendarios con linkedEmail (calendarios profesionales)
      if (!calendar.linkedEmail) {
        skipped++;
        continue;
      }
      
      // Verificar si ya tiene un miembro con el linkedEmail
      const hasProfessionalMember = calendar.members.some(
        member => member.email === calendar.linkedEmail
      );
      
      if (hasProfessionalMember) {
        console.log(`✅ ${calendar.name} ya tiene el miembro profesional`);
        skipped++;
        continue;
      }
      
      // Extraer el nombre del profesional del nombre del calendario
      let professionalName = calendar.name;
      if (professionalName.startsWith('Calendario de ')) {
        professionalName = professionalName.replace('Calendario de ', '');
      }
      
      console.log(`🔧 Arreglando calendario: ${calendar.name}`);
      console.log(`   - linkedEmail: ${calendar.linkedEmail}`);
      console.log(`   - Agregando miembro: ${professionalName}`);
      
      try {
        // Crear el miembro del profesional
        const professionalMember: CalendarUser = {
          id: `professional_${Date.now()}_${calendarDoc.id}`,
          name: professionalName,
          email: calendar.linkedEmail,
          role: 'professional',
          color: calendar.color,
          joinedAt: calendar.createdAt,
          isActive: true
        };
        
        // Actualizar el calendario agregando el miembro
        await updateDoc(doc(db, 'shared_calendars', calendarDoc.id), {
          members: [...calendar.members, professionalMember],
          updatedAt: Timestamp.now()
        });
        
        console.log(`✅ Calendario arreglado: ${calendar.name}`);
        fixed++;
      } catch (error) {
        console.error(`❌ Error arreglando ${calendar.name}:`, error);
        errors++;
      }
    }
    
    console.log('\n📊 Resumen:');
    console.log(`   ✅ Arreglados: ${fixed}`);
    console.log(`   ⏭️  Omitidos: ${skipped}`);
    console.log(`   ❌ Errores: ${errors}`);
    console.groupEnd();
    
    return { fixed, skipped, errors };
    
  } catch (error) {
    console.error('❌ Error en la migración:', error);
    throw error;
  }
}

