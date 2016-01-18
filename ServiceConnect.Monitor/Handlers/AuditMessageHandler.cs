﻿//Copyright (C) 2015  Timothy Watson, Jakub Pachansky

//This program is free software; you can redistribute it and/or
//modify it under the terms of the GNU General Public License
//as published by the Free Software Foundation; either version 2
//of the License, or (at your option) any later version.

//This program is distributed in the hope that it will be useful,
//but WITHOUT ANY WARRANTY; without even the implied warranty of
//MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//GNU General Public License for more details.

//You should have received a copy of the GNU General Public License
//along with this program; if not, write to the Free Software
//Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.

using System;
using System.Collections.Generic;
using System.Globalization;
using System.Threading;
using Microsoft.AspNet.SignalR;
using Newtonsoft.Json;
using ServiceConnect.Monitor.Interfaces;
using ServiceConnect.Monitor.Models;

namespace ServiceConnect.Monitor.Handlers
{
    public class AuditMessageHandler : IDisposable
    {
        private readonly IAuditRepository _auditRepository;
        private readonly IHubContext _hub;
        private readonly Timer _timer;
        private readonly IList<Audit> _audits = new List<Audit>();
        private readonly object _lock = new object();

        public AuditMessageHandler(IAuditRepository auditRepository, IHubContext hub)
        {
            _auditRepository = auditRepository;
            _hub = hub;
            var callback = new TimerCallback(SendAudits);
            _timer = new Timer(callback, null, 0, 2500);
        }

        public void Execute(string message, IDictionary<string, string> headers, string host)
        {
            lock (_lock)
            {
                var audit = new Audit
                {
                    Body = message,
                    DestinationAddress = headers["DestinationAddress"],
                    DestinationMachine = headers["DestinationMachine"],
                    FullTypeName = headers["FullTypeName"],
                    MessageId = headers["MessageId"],
                    MessageType = headers["MessageType"],
                    SourceAddress = headers["SourceAddress"],
                    SourceMachine = headers["SourceMachine"],
                    TypeName = headers["TypeName"],
                    ConsumerType = headers["ConsumerType"],
                    TimeProcessed = DateTime.ParseExact(headers["TimeProcessed"], "O", CultureInfo.InvariantCulture),
                    TimeReceived = DateTime.ParseExact(headers["TimeReceived"], "O", CultureInfo.InvariantCulture),
                    TimeSent = DateTime.ParseExact(headers["TimeSent"], "O", CultureInfo.InvariantCulture),
                    Language = headers["Language"],
                    CorrelationId = JsonConvert.DeserializeObject<Message>(message).CorrelationId,
                    Server = host,
                    Headers = headers
                };

                _auditRepository.InsertAudit(audit);
                _audits.Add(audit);
            }
        }

        private void SendAudits(object state)
        {
            lock (_lock)
            {
                if (_audits.Count > 0)
                {
                    _hub.Clients.All.Audits(_audits);
                    _audits.Clear();
                }
            }
        }

        public void Dispose()
        {
            _timer.Dispose();
        }
    }
}