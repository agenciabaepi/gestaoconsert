import React from 'react';

interface ProdutoVenda {
  id: string;
  nome: string;
  preco: number;
  qty: number;
}

interface Cliente {
  nome: string;
  telefone?: string;
  celular?: string;
  numero_cliente: string;
}

interface CupomVendaProps {
  numeroVenda?: number;
  cliente?: Cliente;
  produtos: ProdutoVenda[];
  subtotal: number;
  desconto: number;
  acrescimo: number;
  total: number;
  formaPagamento: string;
  tipoPedido: string;
  data: string;
  nomeEmpresa?: string;
}

export const CupomVenda: React.FC<CupomVendaProps> = ({
  numeroVenda,
  cliente,
  produtos,
  subtotal,
  desconto,
  acrescimo,
  total,
  formaPagamento,
  tipoPedido,
  data,
  nomeEmpresa = "Sua Empresa"
}) => {
  return (
    <div className="w-80 mx-auto bg-white p-4 text-black font-mono text-sm" style={{ fontFamily: 'Courier, monospace' }}>
      {/* Cabeçalho */}
      <div className="text-center border-b border-dashed border-gray-400 pb-2 mb-2">
        <h1 className="text-lg font-bold">{nomeEmpresa}</h1>
        <p className="text-xs">CUPOM FISCAL NÃO FISCAL</p>
        <p className="text-xs">{data}</p>
        {numeroVenda && <p className="text-xs">Venda #{numeroVenda}</p>}
      </div>

      {/* Cliente */}
      {cliente && (
        <div className="mb-2 text-xs">
          <p>Cliente: {cliente.nome}</p>
          <p>Telefone: {cliente.telefone || cliente.celular || 'N/A'}</p>
          <p>Número: #{cliente.numero_cliente}</p>
        </div>
      )}

      {/* Tipo de pedido */}
      <div className="mb-2 text-xs">
        <p>Tipo: {tipoPedido}</p>
      </div>

      <div className="border-b border-dashed border-gray-400 mb-2"></div>

      {/* Produtos */}
      <div className="mb-2">
        <div className="flex justify-between text-xs font-bold mb-1">
          <span>ITEM</span>
          <span>QTD</span>
          <span>VALOR</span>
        </div>
                 {produtos.map((item) => (
           <div key={item.id}>
             <div className="text-xs mb-1">
               <div className="truncate">{item.nome}</div>
               <div className="flex justify-between">
                 <span>{item.qty} x R$ {item.preco.toFixed(2)}</span>
                 <span>R$ {(item.preco * item.qty).toFixed(2)}</span>
               </div>
             </div>
           </div>
         ))}
      </div>

      <div className="border-b border-dashed border-gray-400 mb-2"></div>

      {/* Totais */}
      <div className="mb-2 text-xs">
        <div className="flex justify-between">
          <span>Subtotal:</span>
          <span>R$ {subtotal.toFixed(2)}</span>
        </div>
        {desconto > 0 && (
          <div className="flex justify-between">
            <span>Desconto:</span>
            <span>- R$ {desconto.toFixed(2)}</span>
          </div>
        )}
        {acrescimo > 0 && (
          <div className="flex justify-between">
            <span>Acréscimo:</span>
            <span>+ R$ {acrescimo.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between font-bold text-base border-t border-gray-400 pt-1 mt-1">
          <span>TOTAL:</span>
          <span>R$ {total.toFixed(2)}</span>
        </div>
      </div>

      {/* Forma de pagamento */}
      <div className="mb-2 text-xs">
        <div className="flex justify-between">
          <span>Pagamento:</span>
          <span>{formaPagamento}</span>
        </div>
      </div>

      <div className="border-b border-dashed border-gray-400 mb-2"></div>

      {/* Rodapé */}
      <div className="text-center text-xs">
        <p>Obrigado pela preferência!</p>
        <p>Volte sempre!</p>
        <div className="mt-2">
          <p className="font-bold">Tecnologia que conecta soluções</p>
          <p>www.consert.app</p>
        </div>
      </div>


    </div>
  );
};

export default CupomVenda; 