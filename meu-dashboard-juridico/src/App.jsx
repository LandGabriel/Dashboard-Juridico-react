import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calendar, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  Users, 
  FileText,
  BarChart3,
  Upload,
  Table,
  Filter,
  TrendingUp,
  MapPin,
  User,
  Gavel,
  PieChart,
  Check,
  Loader,
  AlertCircle
} from 'lucide-react';

// A biblioteca será carregada via index.html

const App = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeTab, setActiveTab] = useState('audiencias');
  
  const [uploadedData, setUploadedData] = useState([]);

  const [audienciasHoje, setAudienciasHoje] = useState([
    { id: 'exemplo-1', AUTOR: 'Exemplo: Carregue sua planilha', ASSUNTO: 'Os dados reais aparecerão aqui', HORÁRIO: '09:30:00', UF: 'SP', ADVOGADO: 'Dr. Exemplo', status: 'pendente', prioridade: 'media' }
  ]);
  
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const getStats = () => {
    const confirmadas = audienciasHoje.filter(a => (a.status || a.STATUS) === 'confirmada').length;
    const pendentes = audienciasHoje.filter(a => (a.status || a.STATUS) === 'pendente').length;
    const urgentes = audienciasHoje.filter(a => (a.status || a.STATUS) === 'urgente').length;
    const total = audienciasHoje.length;
    return { confirmadas, pendentes, urgentes, total };
  };

  const stats = getStats();

  const handleUpdateStatus = (idToUpdate, newStatus) => {
    const updatedAudiencias = audienciasHoje.map(audiencia => {
      if (audiencia.id === idToUpdate) {
        return { ...audiencia, status: newStatus, STATUS: newStatus };
      }
      return audiencia;
    });
    setAudienciasHoje(updatedAudiencias);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        if (typeof window.XLSX === 'undefined') {
            alert("❌ A biblioteca de leitura de planilhas (XLSX) não foi carregada. Verifique o arquivo index.html.");
            return;
        }

        const data = event.target.result;
        const workbook = window.XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = window.XLSX.utils.sheet_to_json(sheet);

        setUploadedData(jsonData);

        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);

        const audienciasFiltradas = jsonData.filter(item => {
            const itemDateValue = item.Data || item.DATA;
            if (!itemDateValue) return false;

            let itemDate;

            if (typeof itemDateValue === 'number') {
                const excelEpoch = new Date(1899, 11, 30);
                itemDate = new Date(excelEpoch.getTime() + itemDateValue * 24 * 60 * 60 * 1000);
            } else if (typeof itemDateValue === 'string') {
                const parts = itemDateValue.split('/');
                if (parts.length === 3) {
                    itemDate = new Date(parts[2], parts[1] - 1, parts[0]);
                } else {
                    itemDate = new Date(itemDateValue);
                }
            } else {
                itemDate = new Date(itemDateValue);
            }
            
            if (isNaN(itemDate.getTime())) return false;

            itemDate.setHours(0, 0, 0, 0);
            return itemDate.getTime() === hoje.getTime();
        }).map((item, index) => ({
            ...item,
            id: `audiencia-${Date.now()}-${index}`
        }));

        setAudienciasHoje(audienciasFiltradas);

        if (audienciasFiltradas.length === 0) {
          alert(`✅ Planilha carregada! Nenhuma audiência encontrada para hoje (${hoje.toLocaleDateString('pt-BR')}).`);
        } else {
          alert(`✅ ${audienciasFiltradas.length} audiência(s) para hoje carregada(s) com sucesso!`);
        }

      } catch (error) {
        console.error("Erro ao processar o arquivo", error);
        alert("❌ Ocorreu um erro ao ler a planilha. Verifique se ela tem uma coluna 'DATA'.");
      }
    };

    reader.readAsBinaryString(file);
  };

  const StatCard = ({ title, value, icon: Icon, color }) => (
    <div className="bg-white p-6 rounded-lg shadow border">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className={`text-2xl font-semibold ${color}`}>{value}</p>
        </div>
        <Icon className={`w-8 h-8 ${color.replace('text-', 'text-').replace('-600', '-500')}`} />
      </div>
    </div>
  );

  const AudienciaCard = ({ audiencia, onUpdateStatus }) => {
    const status = audiencia.status || audiencia.STATUS || 'pendente';
    const prioridade = audiencia.prioridade || audiencia.PRIORIDADE || 'media';
    
    const formatarHorario = (horarioValue) => {
      if (!horarioValue) return '';
      if (typeof horarioValue === 'number' && horarioValue >= 0 && horarioValue < 1) {
        const totalMinutes = Math.round(horarioValue * 24 * 60);
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
      }
      if (typeof horarioValue === 'string') return horarioValue.substring(0, 5);
      return horarioValue.toString().substring(0, 5);
    };

    const horarioFormatado = formatarHorario(audiencia.HORÁRIO || audiencia.HORARIO || audiencia.horario);

    const getStatusColor = (st) => {
      switch (st) {
        case 'confirmada': return 'bg-green-50 border-green-200';
        case 'pendente': return 'bg-yellow-50 border-yellow-200';
        case 'urgente': return 'bg-red-50 border-red-200';
        default: return 'bg-gray-50 border-gray-200';
      }
    };

    const getStatusIcon = (st) => {
      switch (st) {
        case 'confirmada': return <CheckCircle className="w-5 h-5 text-green-500" />;
        case 'pendente': return <Clock className="w-5 h-5 text-yellow-500" />;
        case 'urgente': return <AlertTriangle className="w-5 h-5 text-red-500" />;
        default: return <Clock className="w-5 h-5 text-gray-500" />;
      }
    };
    
    const ActionButton = ({ newStatus, text, icon: Icon, color }) => (
        <button
          onClick={() => onUpdateStatus(audiencia.id, newStatus)}
          disabled={status === newStatus}
          className={`flex items-center space-x-2 px-3 py-1 text-xs font-semibold rounded-md transition-all duration-200
            ${status === newStatus 
              ? `${color.bg} ${color.text} cursor-default` 
              : `bg-gray-200 text-gray-600 hover:bg-gray-300`
            }`}
        >
          <Icon className="w-4 h-4" />
          <span>{text}</span>
        </button>
    );

    return (
      <div className={`p-6 rounded-lg border ${getStatusColor(status)} transition-all duration-300`}>
        <div className="flex items-start space-x-4">
          {getStatusIcon(status)}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-lg font-semibold text-gray-900">{audiencia.AUTOR || audiencia.cliente || 'Autor não informado'}</h4>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                prioridade === 'alta' ? 'bg-red-100 text-red-800' :
                prioridade === 'media' ? 'bg-yellow-100 text-yellow-800' :
                'bg-green-100 text-green-800'
              }`}>
                {String(prioridade).toUpperCase()}
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4" />
                <span>{audiencia.ASSUNTO || audiencia.processo || 'Assunto não informado'}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4" />
                <span>{horarioFormatado || 'Horário não informado'}</span>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4" />
                <span>{audiencia.UF || audiencia.uf || 'UF não informada'}</span>
              </div>
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4" />
                <span>{audiencia.ADVOGADO || audiencia.advogado || 'Advogado não informado'}</span>
              </div>
            </div>
            
            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
                <ActionButton newStatus="confirmada" text="Realizada" icon={Check} color={{bg: "bg-green-200", text: "text-green-800"}} />
                <ActionButton newStatus="pendente" text="Pendente" icon={Loader} color={{bg: "bg-yellow-200", text: "text-yellow-800"}} />
                <ActionButton newStatus="urgente" text="Urgente" icon={AlertCircle} color={{bg: "bg-red-200", text: "text-red-800"}} />
            </div>
          </div>
        </div>
      </div>
    );
  };

  // --- MUDANÇA 1: Novo componente de gráfico de barras ---
  const BarChart = ({ data, title, colorClass = 'bg-blue-500' }) => {
    if (!data || data.length === 0) {
      return (
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
          <p className="text-gray-500">Dados insuficientes para exibir o gráfico.</p>
        </div>
      );
    }
  
    const maxValue = Math.max(...data.map(d => d.value));
  
    return (
      <div className="bg-white p-6 rounded-lg shadow border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <div className="space-y-3">
          {data.sort((a, b) => b.value - a.value).map((item, index) => (
            <div key={index} className="flex items-center space-x-4">
              <div className="w-1/3 text-sm font-medium text-gray-700 truncate" title={item.name}>
                {item.name}
              </div>
              <div className="w-2/3 flex items-center space-x-2">
                <div className="flex-1 bg-gray-200 rounded-full h-5 overflow-hidden">
                  <div 
                    className={`${colorClass} h-full rounded-full transition-all duration-500`}
                    style={{ 
                      width: `${(item.value / maxValue) * 100}%` 
                    }}
                  />
                </div>
                <div className="w-10 text-sm font-bold text-gray-800 text-right">
                  {item.value}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // --- MUDANÇA 2: Lógica para processar os dados para os gráficos ---
  const chartData = useMemo(() => {
    if (uploadedData.length === 0) {
      return { dataPorUF: [], dataPorAdvogado: [], dataPorStatus: [] };
    }

    const countBy = (key1, key2) => {
      return uploadedData.reduce((acc, item) => {
        const value = item[key1] || item[key2] || 'Não Informado';
        acc[value] = (acc[value] || 0) + 1;
        return acc;
      }, {});
    };

    const formatForChart = (dataObject) => {
      return Object.entries(dataObject).map(([name, value]) => ({ name, value }));
    };

    const dataPorUF = formatForChart(countBy('UF', 'uf'));
    const dataPorAdvogado = formatForChart(countBy('ADVOGADO', 'advogado'));
    const dataPorStatus = formatForChart(countBy('STATUS', 'status'));

    return { dataPorUF, dataPorAdvogado, dataPorStatus };
  }, [uploadedData]);


  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Gavel className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Painel de Controle Jurídico</h1>
            </div>
            
            <div className="flex items-center space-x-6">
              {stats.urgentes > 0 && (
                <div className="flex items-center space-x-2 bg-red-100 text-red-700 px-3 py-1 rounded-full animate-pulse">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-sm font-medium">{stats.urgentes} Urgente(s)!</span>
                </div>
              )}
              
              <div className="flex items-center space-x-2 text-gray-600">
                <Clock className="w-5 h-5" />
                <span className="font-mono text-lg">
                  {currentTime.toLocaleTimeString('pt-BR')}
                </span>
              </div>
              
              <div className="text-sm text-gray-500">
                {currentTime.toLocaleDateString('pt-BR', { 
                  weekday: 'long', 
                  day: 'numeric', 
                  month: 'long'
                })}
              </div>
            </div>
          </div>
        </div>
      </header>

      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {[
              { key: 'audiencias', label: 'Audiências Hoje', icon: Gavel },
              { key: 'dashboard', label: 'Dashboard Geral', icon: BarChart3 },
              { key: 'upload', label: 'Upload Dados', icon: Upload },
              { key: 'tabela', label: 'Tabela de Dados', icon: Table }
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-all focus:outline-none ${
                  activeTab === key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'audiencias' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard title="Realizadas" value={stats.confirmadas} icon={CheckCircle} color="text-green-600" />
              <StatCard title="Pendentes" value={stats.pendentes} icon={Clock} color="text-yellow-600" />
              <StatCard title="Urgentes" value={stats.urgentes} icon={AlertTriangle} color="text-red-600" />
              <StatCard title="Total de Hoje" value={stats.total} icon={Calendar} color="text-blue-600" />
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900">Agenda do Dia</h2>
              {audienciasHoje.length > 0 ? (
                audienciasHoje.map((audiencia) => (
                  <AudienciaCard key={audiencia.id} audiencia={audiencia} onUpdateStatus={handleUpdateStatus} />
                ))
              ) : (
                <div className="bg-white p-8 rounded-lg shadow border text-center">
                  <Calendar className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">Nenhuma audiência para hoje</h2>
                  <p className="text-gray-500">Carregue uma planilha na aba "Upload Dados" para ver a agenda.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'upload' && (
          <div className="bg-white p-8 rounded-lg shadow border">
            <div className="text-center">
              <Upload className="mx-auto h-16 w-16 text-gray-400 mb-4" />
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">Upload de Dados</h2>
              <p className="text-gray-500 mb-6">
                Carregue uma planilha (.xlsx, .xls, .csv) com seus dados.
              </p>
              
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 cursor-pointer transition-colors"
              >
                <Upload className="w-5 h-5 mr-2" />
                Selecionar Planilha
              </label>
            </div>
          </div>
        )}

        {/* --- MUDANÇA 3: A aba Dashboard agora renderiza os novos gráficos --- */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {uploadedData.length === 0 ? (
              <div className="bg-white p-8 rounded-lg shadow border text-center">
                <BarChart3 className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Dashboard Vazio</h2>
                <p className="text-gray-500">Carregue dados na aba "Upload Dados" para ver as análises.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <BarChart data={chartData.dataPorUF} title="Processos por UF" colorClass="bg-blue-500" />
                <BarChart data={chartData.dataPorAdvogado} title="Processos por Advogado" colorClass="bg-green-500" />
                <div className="lg:col-span-2">
                  <BarChart data={chartData.dataPorStatus} title="Processos por Status" colorClass="bg-yellow-500" />
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'tabela' && (
          <div className="bg-white rounded-lg shadow border">
            <div className="px-6 py-4 border-b">
              <h2 className="text-xl font-semibold text-gray-900">Dados Completos da Planilha</h2>
            </div>
            
            {uploadedData.length === 0 ? (
              <div className="p-8 text-center">
                <Table className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                <p className="text-gray-500">Nenhum dado carregado.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {Object.keys(uploadedData[0]).map(key => (
                        <th key={key} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {key}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {uploadedData.map((row, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        {Object.values(row).map((value, idx) => (
                          <td key={idx} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {String(value)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
