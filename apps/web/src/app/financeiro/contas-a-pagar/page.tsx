import MenuLayout from '@/components/MenuLayout';
import { FiAlertCircle, FiClock, FiCreditCard, FiBarChart2 } from 'react-icons/fi';
import DashboardCard from '@/components/ui/DashboardCard';

const mockData = {
  atrasadas: 3,
  aVencer: 7,
  saldoTotal: 2450.75,
  totalPrevisto: 3200.00,
};

const cards = [
  {
    title: 'Atrasadas',
    value: mockData.atrasadas,
    icon: <FiAlertCircle className="w-6 h-6" />,
    bgClass: 'bg-white',
    colorClass: '',
    description: '+2 este mês',
    descriptionColorClass: 'text-red-500',
    descriptionIcon: <FiAlertCircle className="w-4 h-4" />,
    svgPolyline: { color: '#f87171', points: '0,12 10,14 20,16 30,18 40,20 50,17 60,15 70,16' },
  },
  {
    title: 'A Vencer',
    value: mockData.aVencer,
    icon: <FiClock className="w-6 h-6" />,
    bgClass: 'bg-white',
    colorClass: '',
    description: '+1 esta semana',
    descriptionColorClass: 'text-yellow-500',
    descriptionIcon: <FiClock className="w-4 h-4" />,
    svgPolyline: { color: '#facc15', points: '0,18 10,16 20,14 30,10 40,11 50,9 60,10 70,6' },
  },
  {
    title: 'Saldo Total a Pagar',
    value: `R$ ${mockData.saldoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
    icon: <FiCreditCard className="w-6 h-6" />,
    bgClass: 'bg-white',
    colorClass: '',
    description: 'R$ 1.200,00 vencendo',
    descriptionColorClass: 'text-blue-500',
    descriptionIcon: <FiCreditCard className="w-4 h-4" />,
    svgPolyline: { color: '#60a5fa', points: '0,20 10,16 20,14 30,10 40,11 50,8 60,6 70,4' },
  },
  {
    title: 'Total Previsto',
    value: `R$ ${mockData.totalPrevisto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
    icon: <FiBarChart2 className="w-6 h-6" />,
    bgClass: 'bg-white',
    colorClass: '',
    description: '+10% em relação ao mês anterior',
    descriptionColorClass: 'text-green-500',
    descriptionIcon: <FiBarChart2 className="w-4 h-4" />,
    svgPolyline: { color: '#84cc16', points: '0,20 10,15 20,17 30,10 40,12 50,8 60,10 70,6' },
  },
];

export default function ContasAPagarPage() {
  return (
    <MenuLayout>
      <div className="py-10 px-6 w-full">
        <h1 className="text-2xl font-bold mb-4 text-gray-900">Contas a Pagar</h1>
        <p className="text-gray-600 mb-8">Gerencie aqui todas as contas a pagar do seu negócio. Em breve, você poderá cadastrar, visualizar e quitar contas diretamente por esta tela.</p>
        {/* Cards resumo */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-10">
          {cards.map((card) => (
            <DashboardCard
              key={card.title}
              title={card.title}
              value={card.value}
              icon={card.icon}
              bgClass={card.bgClass}
              colorClass={card.colorClass}
              description={card.description}
              descriptionColorClass={card.descriptionColorClass}
              descriptionIcon={card.descriptionIcon}
              svgPolyline={card.svgPolyline}
            />
          ))}
        </div>
        {/* Espaço para futura tabela/listagem de contas */}
        <div className="bg-white border border-gray-200 rounded-xl p-8 shadow text-center text-gray-400">
          Nenhuma conta cadastrada ainda.
        </div>
      </div>
    </MenuLayout>
  );
} 