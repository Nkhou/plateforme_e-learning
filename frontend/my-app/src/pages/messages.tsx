// import React, { useState, useEffect, useRef } from 'react';
// import { MessageCircle, Send, X, Check, CheckCheck, MoreVertical, Trash2, Search } from 'lucide-react';

// // Mock data for demonstration
// const mockConversations = [
//   {
//     id: 1,
//     user: { id: 2, username: 'Jean Dupont', fullName: 'Jean Dupont' },
//     lastMessage: {
//       text: "It is a long established fact that a reader will be distracted by the readable content of a page...",
//       timestamp: '2024-11-16T10:00:00',
//       isRead: false,
//       sender: 2
//     },
//     unreadCount: 3
//   },
//   {
//     id: 2,
//     user: { id: 3, username: 'Marie Martin', fullName: 'Marie Martin' },
//     lastMessage: {
//       text: "Merci pour votre réponse rapide!",
//       timestamp: '2024-11-16T09:30:00',
//       isRead: true,
//       sender: 1
//     },
//     unreadCount: 0
//   }
// ];

// const mockMessages = [
//   {
//     id: 1,
//     sender: 2,
//     receiver: 1,
//     message: "Contrary to popular belief, Lorem Ipsum is not simply random text. It has roots in a piece of classical Latin literature from 45 BC, making it over 2000 years old. Richard McClintock, a Latin professor.",
//     timestamp: '2024-11-16T08:00:00',
//     isRead: true
//   },
//   {
//     id: 2,
//     sender: 1,
//     receiver: 2,
//     message: "Contrary to popular belief, Lorem Ipsum is not simply random text. It has roots in a piece of classical Latin literature from 45 BC, making it over 2000 years old. Richard McClintock, a Latin professor.",
//     timestamp: '2024-11-16T08:30:00',
//     isRead: true
//   },
//   {
//     id: 3,
//     sender: 2,
//     receiver: 1,
//     message: "Contrary to popular belief, Lorem Ipsum is not simply random text. It has roots in a piece of classical Latin literature from 45 BC, making it over 2000 years old. Richard McClintock, a Latin professor.",
//     timestamp: '2024-11-16T09:00:00',
//     isRead: true
//   },
//   {
//     id: 4,
//     sender: 1,
//     receiver: 2,
//     message: "Contrary to popular belief, Lorem Ipsum is not simply random text. It has roots in a piece of classical Latin literature from 45 BC, making it over 2000 years old. Richard McClintock, a Latin professor.",
//     timestamp: '2024-11-16T09:30:00',
//     isRead: true
//   }
// ];

// const MessagingSystem = () => {
//   const [currentView, setCurrentView] = useState('list'); // 'list' or 'chat'
//   const [conversations, setConversations] = useState(mockConversations);
//   const [selectedConversation, setSelectedConversation] = useState(null);
//   const [messages, setMessages] = useState([]);
//   const [newMessage, setNewMessage] = useState('');
//   const [searchQuery, setSearchQuery] = useState('');
//   const [currentUserId] = useState(1); // Simulated logged-in user
//   const messagesEndRef = useRef(null);

//   const scrollToBottom = () => {
//     messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
//   };

//   useEffect(() => {
//     scrollToBottom();
//   }, [messages]);

//   const formatTime = (timestamp) => {
//     const date = new Date(timestamp);
//     const now = new Date();
//     const diff = now - date;
//     const hours = Math.floor(diff / (1000 * 60 * 60));
    
//     if (hours < 1) {
//       const minutes = Math.floor(diff / (1000 * 60));
//       return `Il y a ${minutes} minute${minutes > 1 ? 's' : ''}`;
//     }
//     if (hours < 24) {
//       return `Il y a ${hours} heure${hours > 1 ? 's' : ''}`;
//     }
//     const days = Math.floor(hours / 24);
//     return `Il y a ${days} jour${days > 1 ? 's' : ''}`;
//   };

//   const handleSelectConversation = (conversation) => {
//     setSelectedConversation(conversation);
//     setMessages(mockMessages);
//     setCurrentView('chat');
    
//     // Mark messages as read
//     const updatedConversations = conversations.map(conv => 
//       conv.id === conversation.id ? { ...conv, unreadCount: 0 } : conv
//     );
//     setConversations(updatedConversations);
//   };

//   const handleSendMessage = (e) => {
//     e.preventDefault();
//     if (!newMessage.trim()) return;

//     const message = {
//       id: messages.length + 1,
//       sender: currentUserId,
//       receiver: selectedConversation.user.id,
//       message: newMessage,
//       timestamp: new Date().toISOString(),
//       isRead: false
//     };

//     setMessages([...messages, message]);
//     setNewMessage('');
//   };

//   const handleDeleteConversation = (conversationId, e) => {
//     e.stopPropagation();
//     setConversations(conversations.filter(c => c.id !== conversationId));
//   };

//   const filteredConversations = conversations.filter(conv =>
//     conv.user.fullName.toLowerCase().includes(searchQuery.toLowerCase())
//   );

//   // Messages List View
//   if (currentView === 'list') {
//     return (
//       <div className="min-h-screen bg-gray-50 p-6">
//         <div className="max-w-6xl mx-auto">
//           {/* Header */}
//           <div className="bg-white rounded-lg shadow-sm mb-6 p-6">
//             <div className="flex items-center justify-between mb-4">
//               <h1 className="text-2xl font-bold text-gray-900">
//                 {conversations.reduce((acc, conv) => acc + conv.unreadCount, 0)} messages
//               </h1>
//               <div className="flex gap-3">
//                 <button className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors flex items-center gap-2">
//                   <Trash2 size={16} />
//                   Supprimer
//                 </button>
//                 <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
//                   <MessageCircle size={16} />
//                   Nouveau message
//                 </button>
//               </div>
//             </div>

//             {/* Search */}
//             <div className="relative">
//               <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
//               <input
//                 type="text"
//                 placeholder="Rechercher une conversation..."
//                 value={searchQuery}
//                 onChange={(e) => setSearchQuery(e.target.value)}
//                 className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//               />
//             </div>
//           </div>

//           {/* Conversations List */}
//           <div className="space-y-2">
//             {filteredConversations.map(conversation => (
//               <div
//                 key={conversation.id}
//                 onClick={() => handleSelectConversation(conversation)}
//                 className={`bg-white rounded-lg shadow-sm p-4 cursor-pointer hover:shadow-md transition-all ${
//                   conversation.unreadCount > 0 ? 'bg-blue-50' : ''
//                 }`}
//               >
//                 <div className="flex items-start gap-4">
//                   {/* Avatar */}
//                   <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
//                     <span className="text-blue-600 font-semibold text-lg">
//                       {conversation.user.fullName.charAt(0)}
//                     </span>
//                   </div>

//                   {/* Message Content */}
//                   <div className="flex-1 min-w-0">
//                     <div className="flex items-center justify-between mb-1">
//                       <h3 className="font-semibold text-gray-900">
//                         {conversation.user.fullName}
//                       </h3>
//                       <span className="text-sm text-gray-500">
//                         {formatTime(conversation.lastMessage.timestamp)}
//                       </span>
//                     </div>
//                     <p className="text-sm text-gray-600 mb-2">
//                       Feedback sur votre progrès de lecture
//                     </p>
//                     <div className="flex items-center justify-between">
//                       <p className="text-sm text-gray-500 truncate flex-1">
//                         {conversation.lastMessage.sender === currentUserId && (
//                           <span className="mr-1">
//                             {conversation.lastMessage.isRead ? (
//                               <CheckCheck size={16} className="inline text-blue-600" />
//                             ) : (
//                               <Check size={16} className="inline text-gray-400" />
//                             )}
//                           </span>
//                         )}
//                         {conversation.lastMessage.text}
//                       </p>
//                       {conversation.unreadCount > 0 && (
//                         <span className="ml-2 px-2 py-1 text-xs font-semibold text-white bg-orange-500 rounded-full">
//                           Message non lu
//                         </span>
//                       )}
//                     </div>
//                   </div>

//                   {/* Actions */}
//                   <button
//                     onClick={(e) => handleDeleteConversation(conversation.id, e)}
//                     className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
//                   >
//                     <MoreVertical size={20} />
//                   </button>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>
//       </div>
//     );
//   }

//   // Chat View
//   return (
//     <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
//       <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col" style={{ height: '85vh' }}>
//         {/* Chat Header */}
//         <div className="bg-white border-b border-gray-200 px-6 py-4">
//           <div className="flex items-center justify-between">
//             <div className="flex items-center gap-3">
//               <MessageCircle className="text-blue-600" size={24} />
//               <div>
//                 <h2 className="font-semibold text-gray-900">
//                   Vous communiquer avec
//                 </h2>
//                 <p className="text-sm text-gray-600">
//                   {selectedConversation?.user.fullName}
//                 </p>
//               </div>
//             </div>
//             <button
//               onClick={() => setCurrentView('list')}
//               className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
//             >
//               Fermer
//             </button>
//           </div>
          
//           {/* Security Notice */}
//           <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
//             <p className="text-sm text-yellow-800">
//               <strong>Note :</strong> Vous converser en toute sécurité. Tous les messages que vous échangez seront encrypter.
//             </p>
//           </div>
//         </div>

//         {/* Messages Container */}
//         <div className="flex-1 overflow-y-auto px-6 py-4 bg-gray-50">
//           {messages.map((msg) => {
//             const isCurrentUser = msg.sender === currentUserId;
//             return (
//               <div
//                 key={msg.id}
//                 className={`mb-4 flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
//               >
//                 <div className={`max-w-lg ${isCurrentUser ? 'ml-12' : 'mr-12'}`}>
//                   <div
//                     className={`rounded-2xl px-4 py-3 ${
//                       isCurrentUser
//                         ? 'bg-gray-300 text-gray-900'
//                         : 'bg-white text-gray-900 border border-gray-200'
//                     }`}
//                   >
//                     <p className="text-sm leading-relaxed">{msg.message}</p>
//                   </div>
//                   <div className={`flex items-center gap-2 mt-1 px-2 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
//                     <span className="text-xs text-gray-500">
//                       {formatTime(msg.timestamp)}
//                     </span>
//                     {isCurrentUser && (
//                       msg.isRead ? (
//                         <CheckCheck size={16} className="text-blue-600" />
//                       ) : (
//                         <Check size={16} className="text-gray-400" />
//                       )
//                     )}
//                   </div>
//                 </div>
//               </div>
//             );
//           })}
//           <div ref={messagesEndRef} />
//         </div>

//         {/* Message Input */}
//         <form onSubmit={handleSendMessage} className="bg-white border-t border-gray-200 px-6 py-4">
//           <div className="flex items-center gap-3">
//             <input
//               type="text"
//               value={newMessage}
//               onChange={(e) => setNewMessage(e.target.value)}
//               placeholder="Entrez votre message"
//               className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//             />
//             <button
//               type="submit"
//               disabled={!newMessage.trim()}
//               className="p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
//             >
//               <Send size={20} />
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// };

// export default MessagingSystem;