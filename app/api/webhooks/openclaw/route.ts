import { NextResponse } from 'next/server';

// Webhook para integração com o OpenClaw
// O OpenClaw pode usar este endpoint para:
// 1. Cadastrar pacientes
// 2. Atualizar o Kanban
// 3. Gerenciar o calendário
// 4. Buscar histórico de conversas

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { action, payload } = data;

    switch (action) {
      case 'REGISTER_PATIENT':
        // TODO: Chamar Prisma para criar Paciente
        // await prisma.paciente.create({ data: payload });
        return NextResponse.json({ success: true, message: 'Paciente cadastrado' });

      case 'UPDATE_KANBAN':
        // TODO: Atualizar etapa da Conversa
        // await prisma.conversa.update({ ... });
        return NextResponse.json({ success: true, message: 'Kanban atualizado' });

      case 'SCHEDULE_APPOINTMENT':
        // TODO: Criar Agendamento no Prisma
        // await prisma.agendamento.create({ ... });
        return NextResponse.json({ success: true, message: 'Agendamento criado' });

      case 'GET_CONVERSATION':
        // TODO: Buscar mensagens do paciente
        return NextResponse.json({ success: true, data: [] });

      default:
        return NextResponse.json(
          { success: false, error: 'Ação não reconhecida' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno no webhook' },
      { status: 500 }
    );
  }
}
