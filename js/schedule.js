fetch("/api/schedules")
    .then(response => response.json())
    .then(schedules => {

        const scheduleList =
            document.querySelector("#schedule-page-list");

        scheduleList.innerHTML = "";

        // 今日の日付
        const today = new Date();

        const currentYear = today.getFullYear();
        const currentMonth = today.getMonth() + 1;
        const currentDay = today.getDate();


        // 今日以降の日程だけ残す
        schedules = schedules.filter(schedule => {

            const scheduleDate =
                new Date(
                    currentYear,
                    schedule.month - 1,
                    schedule.day
                );

            const todayDate =
                new Date(
                    currentYear,
                    currentMonth - 1,
                    currentDay
                );

            return scheduleDate >= todayDate;

        });

        schedules.sort((a, b) => {

            const dateA =
                new Date(
                    currentYear,
                    a.month - 1,
                    a.day
                );

            const dateB =
                new Date(
                    currentYear,
                    b.month - 1,
                    b.day
                );

            return dateA - dateB;

        });


        if (schedules.length === 0) {

            scheduleList.innerHTML = `
                <p class="schedule-loading">
                    現在、公開されている出船予定はありません。
                </p>
            `;

            return;
        }


        schedules.forEach(schedule => {

            const card =
                document.createElement("article");

            card.className =
                "schedule-modern-card";


            // ステータス
            let statusText = "予約情報";


            if (schedule.remaining !== null) {

                if (schedule.remaining <= 0) {

                    statusText = "満席";

                } else {

                    statusText =
                        `残り${schedule.remaining}名`;

                }

            } else {

                statusText =
                    "詳細はブログをご確認ください";

            }


            // 釣り物
            const fishingType =
                schedule.fishingType === "不明"
                    ? "釣り物はブログをご確認ください"
                    : schedule.fishingType;


            card.innerHTML = `

                <div class="schedule-modern-date">

                    <span>DATE</span>

                    <strong>
                        ${schedule.month} / ${schedule.day}
                    </strong>

                    <small>
                        ${schedule.weekday}曜日
                    </small>

                </div>


                <div class="schedule-modern-content">

                    <span class="schedule-modern-label">
                        FISHING
                    </span>

                    <h3>
                        ${fishingType}
                    </h3>

                    <div class="schedule-modern-info">

                        <p>
                            <span>予約</span>
                            ${schedule.reserved}名予約中
                        </p>

                        <p>
                            <span>定員</span>
                            ${schedule.capacity !== null
                    ? `${schedule.capacity}名`
                    : "確認中"
                }
                        </p>

                    </div>

                </div>


                <div class="schedule-modern-action">

                    <span class="schedule-status">
                        ${statusText}
                    </span>

                    <a
                        href="${schedule.source}"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="schedule-button">

                        日程の詳細 →

                    </a>

                </div>

            `;


            scheduleList.appendChild(card);

        });

    })
    .catch(error => {

        console.error(
            "出船予定取得エラー:",
            error
        );


        const scheduleList =
            document.querySelector("#schedule-page-list");


        scheduleList.innerHTML = `

            <p class="schedule-loading">
                出船予定を取得できませんでした。
            </p>

        `;

    });